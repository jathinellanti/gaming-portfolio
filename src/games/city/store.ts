import { create } from "zustand";
import { z } from "zod";
import { versionedStore } from "../../platform/storage";
import { MARKERS, type MissionId } from "./world/layout";

// SUNSET BAY UI state (React renders from this); per-frame state lives in runtime.ts.

export type CityScreen = null | "mission" | "phone" | "pause" | "map" | "settings";
export type Quality = "low" | "medium" | "high";

const IDS = MARKERS.map((m) => m.id) as [MissionId, ...MissionId[]];
const saveSchema = z.object({
  passed: z.array(z.enum(IDS)),
  quality: z.enum(["low", "medium", "high"]),
  sensitivity: z.number().min(0.2).max(3),
  helpSeen: z.boolean(),
});
type CitySave = z.infer<typeof saveSchema>;

const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
const DEFAULTS: CitySave = { passed: [], quality: coarse ? "low" : "medium", sensitivity: 1, helpSeen: false };
export const citySave = versionedStore("jp.city.v1", 1, (r) => saveSchema.parse(r), DEFAULTS);
const initial = citySave.load();

interface CityState extends CitySave {
  screen: CityScreen;
  mission: MissionId | null;
  /** "MISSION PASSED" banner: the mission it celebrates, while showing. */
  passedBanner: MissionId | null;
  help: string | null;
  teleport: [number, number] | null;
  openMission(id: MissionId): void;
  open(screen: Exclude<CityScreen, null | "mission">): void;
  close(): void;
  completeMission(): void;
  setHelp(text: string | null): void;
  requestTeleport(at: [number, number]): void;
  consumeTeleport(): [number, number] | null;
  setOption(p: Partial<Pick<CitySave, "quality" | "sensitivity">>): void;
  dismissHelp(): void;
}

const persist = (s: CitySave) => citySave.save({ passed: s.passed, quality: s.quality, sensitivity: s.sensitivity, helpSeen: s.helpSeen });

export const useCity = create<CityState>((set, get) => ({
  ...initial,
  screen: null,
  mission: null,
  passedBanner: null,
  help: null,
  teleport: null,
  openMission: (id) => set({ screen: "mission", mission: id }),
  open: (screen) => set({ screen }),
  close: () => set({ screen: null }),
  completeMission: () => {
    const { mission, passed } = get();
    if (!mission) return set({ screen: null });
    const first = !passed.includes(mission);
    set({ screen: null, passed: first ? [...passed, mission] : passed, passedBanner: mission });
    persist(get());
    setTimeout(() => {
      if (get().passedBanner === mission) set({ passedBanner: null });
    }, 4200);
  },
  setHelp: (text) => {
    if (get().help !== text) set({ help: text });
  },
  requestTeleport: (at) => set({ teleport: at, screen: null }),
  consumeTeleport: () => {
    const t = get().teleport;
    if (t) set({ teleport: null });
    return t;
  },
  setOption: (p) => {
    set(p);
    persist(get());
  },
  dismissHelp: () => {
    set({ helpSeen: true });
    persist(get());
  },
}));
