import { create } from "zustand";
import { z } from "zod";
import { versionedStore } from "../../platform/storage";
import { REGIONS, type RegionId, type ScreenId } from "./world/structures";

// Block World UI/game state that React renders. Per-frame player state lives in
// a mutable ref (player/Player.tsx), not here, to avoid re-rendering every frame.

export type Screen = ScreenId | "pause" | "map" | "chat" | "options" | "guide" | null;

export interface Toast {
  id: number;
  title: string;
  body: string;
}

const REGION_IDS = REGIONS.map((r) => r.id) as [RegionId, ...RegionId[]];

const saveSchema = z.object({
  discovered: z.array(z.enum(REGION_IDS)),
  pos: z.tuple([z.number(), z.number(), z.number(), z.number(), z.number()]).nullable(),
  time: z.number().min(0).max(1),
  hotbar: z.number().int().min(0).max(8),
  renderDistance: z.number().int().min(2).max(10),
  fov: z.number().min(50).max(110),
  sensitivity: z.number().min(0.2).max(3),
  dayLengthMin: z.number().min(2).max(60),
});
export type BlockSave = z.infer<typeof saveSchema>;

const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
export const DEFAULT_SAVE: BlockSave = {
  discovered: [],
  pos: null,
  time: 0.08,
  hotbar: 0,
  renderDistance: coarse ? 3 : 5,
  fov: 75,
  sensitivity: 1,
  dayLengthMin: 20,
};

export const blockSave = versionedStore("jp.block.v1", 1, (r) => saveSchema.parse(r), DEFAULT_SAVE);

interface BlockState extends Omit<BlockSave, "pos"> {
  screen: Screen;
  screenArg: string | number | null;
  cameraMode: 0 | 1 | 2;
  debug: boolean;
  toasts: Toast[];
  actionbar: { text: string; until: number } | null;
  title: { title: string; subtitle: string; until: number } | null;
  region: RegionId | null;
  teleport: [number, number, number, number] | null;
  chatLog: { text: string; kind: "info" | "error" | "player" }[];
  open(screen: Exclude<Screen, null>, arg?: string | number | null): void;
  close(): void;
  setHotbar(i: number): void;
  setTime(t: number): void;
  cycleCamera(): void;
  toggleDebug(): void;
  /** Returns true the first time a region is discovered. */
  discover(id: RegionId): boolean;
  pushToast(title: string, body: string): void;
  dropToast(id: number): void;
  say(text: string, ms?: number): void;
  showTitle(title: string, subtitle: string, ms?: number): void;
  setRegion(id: RegionId | null): void;
  requestTeleport(t: [number, number, number, number]): void;
  consumeTeleport(): [number, number, number, number] | null;
  setOption(patch: Partial<Pick<BlockSave, "renderDistance" | "fov" | "sensitivity" | "dayLengthMin">>): void;
  chat(text: string, kind?: "info" | "error" | "player"): void;
}

let toastId = 1;
const initial = blockSave.load();

export const useBlock = create<BlockState>((set, get) => ({
  discovered: initial.discovered,
  time: initial.time,
  hotbar: initial.hotbar,
  renderDistance: initial.renderDistance,
  fov: initial.fov,
  sensitivity: initial.sensitivity,
  dayLengthMin: initial.dayLengthMin,
  screen: null,
  screenArg: null,
  cameraMode: 0,
  debug: false,
  toasts: [],
  actionbar: null,
  title: null,
  region: null,
  teleport: null,
  chatLog: [],
  open: (screen, arg = null) => set({ screen, screenArg: arg }),
  close: () => set({ screen: null, screenArg: null }),
  setHotbar: (i) => set({ hotbar: ((i % 9) + 9) % 9 }),
  setTime: (t) => set({ time: ((t % 1) + 1) % 1 }),
  cycleCamera: () => set({ cameraMode: ((get().cameraMode + 1) % 3) as 0 | 1 | 2 }),
  toggleDebug: () => set({ debug: !get().debug }),
  discover: (id) => {
    if (get().discovered.includes(id)) return false;
    set({ discovered: [...get().discovered, id] });
    return true;
  },
  pushToast: (title, body) => {
    const id = toastId++;
    set({ toasts: [...get().toasts, { id, title, body }].slice(-3) });
    setTimeout(() => get().dropToast(id), 5000);
  },
  dropToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  say: (text, ms = 2600) => set({ actionbar: { text, until: performance.now() + ms } }),
  showTitle: (title, subtitle, ms = 3200) => set({ title: { title, subtitle, until: performance.now() + ms } }),
  setRegion: (id) => {
    if (get().region !== id) set({ region: id });
  },
  requestTeleport: (t) => set({ teleport: t }),
  consumeTeleport: () => {
    const t = get().teleport;
    if (t) set({ teleport: null });
    return t;
  },
  setOption: (patch) => set(patch),
  chat: (text, kind = "info") => set({ chatLog: [...get().chatLog, { text, kind }].slice(-30) }),
}));

export function persistBlock(pos: BlockSave["pos"]) {
  const s = useBlock.getState();
  blockSave.save({
    discovered: s.discovered,
    pos,
    time: s.time,
    hotbar: s.hotbar,
    renderDistance: s.renderDistance,
    fov: s.fov,
    sensitivity: s.sensitivity,
    dayLengthMin: s.dayLengthMin,
  });
}

export { initial as initialBlockSave };
