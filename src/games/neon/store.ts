import { create } from "zustand";
import { z } from "zod";
import { versionedStore } from "../../platform/storage";
import { FpsInput } from "../../platform/fpsInput";
import { POIS, SPAWN, type ScreenId } from "./world/city";

// Neon City state. React renders from the zustand store; per-frame player state
// lives in `neonRuntime` (mutable, outside React).

export type HubTab = Exclude<ScreenId, "exit"> | "map";
export type NeonScreen = null | "hub" | "pause" | "settings" | "exit";
export type Quality = "low" | "medium" | "high";

const POI_IDS = POIS.map((p) => p.id) as [string, ...string[]];
const saveSchema = z.object({
  discovered: z.array(z.enum(POI_IDS)),
  pos: z.tuple([z.number(), z.number(), z.number()]).nullable(),
  quality: z.enum(["low", "medium", "high"]),
  fov: z.number().min(50).max(110),
  sensitivity: z.number().min(0.2).max(3),
  callSeen: z.boolean(),
});
type NeonSave = z.infer<typeof saveSchema>;

const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
const DEFAULTS: NeonSave = { discovered: [], pos: null, quality: coarse ? "low" : "medium", fov: 78, sensitivity: 1, callSeen: false };
export const neonSave = versionedStore("jp.neon.v1", 1, (r) => saveSchema.parse(r), DEFAULTS);
const initial = neonSave.load();

interface NeonState extends Omit<NeonSave, "pos"> {
  screen: NeonScreen;
  tab: HubTab;
  tabArg: string | null;
  scanning: boolean;
  toasts: { id: number; title: string; body: string }[];
  teleport: [number, number, number] | null;
  callOpen: boolean;
  openHub(tab: HubTab, arg?: string | null): void;
  open(screen: Exclude<NeonScreen, null | "hub">): void;
  close(): void;
  setScanning(on: boolean): void;
  discover(id: string): boolean;
  toast(title: string, body: string): void;
  requestTeleport(t: [number, number, number]): void;
  consumeTeleport(): [number, number, number] | null;
  setOption(p: Partial<Pick<NeonSave, "quality" | "fov" | "sensitivity">>): void;
  setCall(open: boolean): void;
}

let toastId = 1;

export const useNeon = create<NeonState>((set, get) => ({
  discovered: initial.discovered,
  quality: initial.quality,
  fov: initial.fov,
  sensitivity: initial.sensitivity,
  callSeen: initial.callSeen,
  screen: null,
  tab: "character",
  tabArg: null,
  scanning: false,
  toasts: [],
  teleport: null,
  callOpen: false,
  openHub: (tab, arg = null) => set({ screen: "hub", tab, tabArg: arg }),
  open: (screen) => set({ screen }),
  close: () => set({ screen: null, tabArg: null }),
  setScanning: (on) => {
    if (get().scanning !== on) set({ scanning: on });
  },
  discover: (id) => {
    if (get().discovered.includes(id)) return false;
    set({ discovered: [...get().discovered, id] });
    return true;
  },
  toast: (title, body) => {
    const id = toastId++;
    set({ toasts: [...get().toasts, { id, title, body }].slice(-3) });
    setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 4500);
  },
  requestTeleport: (t) => set({ teleport: t }),
  consumeTeleport: () => {
    const t = get().teleport;
    if (t) set({ teleport: null });
    return t;
  },
  setOption: (p) => set(p),
  setCall: (open) => set({ callOpen: open, callSeen: true }),
}));

export const neonRuntime = {
  input: new FpsInput(),
  walker: { x: (initial.pos ?? SPAWN)[0], y: 0, z: (initial.pos ?? SPAWN)[1], vy: 0, onGround: true },
  yaw: (initial.pos ?? SPAWN)[2],
  pitch: 0,
  nearPoi: null as string | null,
  fps: 60,
  /** The R3F camera, for projecting scanner tags onto the HUD. */
  camera: null as import("three").Camera | null,
};

export function persistNeon() {
  const s = useNeon.getState();
  const w = neonRuntime.walker;
  neonSave.save({ discovered: s.discovered, pos: [w.x, w.z, neonRuntime.yaw], quality: s.quality, fov: s.fov, sensitivity: s.sensitivity, callSeen: s.callSeen });
}
