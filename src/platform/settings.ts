import { create } from "zustand";
import { versionedStore } from "./storage";

const THEMES = ["dark", "light"] as const;
const QUALITIES = ["auto", "low", "medium", "high", "ultra"] as const;

export interface Settings {
  theme: (typeof THEMES)[number];
  sound: boolean;
  /** Generative game music; sound effects and ambience follow `sound` alone. */
  music: boolean;
  quality: (typeof QUALITIES)[number];
  lite: boolean;
  welcomeDismissed: boolean;
}
export type Theme = Settings["theme"];

export const SETTINGS_KEY = "jp.settings.v1";
export const SETTINGS_VERSION = 2;
export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  sound: true,
  music: true,
  quality: "auto",
  lite: false,
  welcomeDismissed: false,
};

/** Validates untrusted stored data; throws on anything that isn't exactly a Settings. */
export function parseSettings(raw: unknown): Settings {
  const r = raw as Record<string, unknown> | null;
  if (
    !r ||
    typeof r !== "object" ||
    !THEMES.includes(r.theme as Theme) ||
    typeof r.sound !== "boolean" ||
    typeof r.music !== "boolean" ||
    !QUALITIES.includes(r.quality as Settings["quality"]) ||
    typeof r.lite !== "boolean" ||
    typeof r.welcomeDismissed !== "boolean"
  ) {
    throw new Error("stored settings have the wrong shape");
  }
  return { theme: r.theme as Theme, sound: r.sound, music: r.music, quality: r.quality as Settings["quality"], lite: r.lite, welcomeDismissed: r.welcomeDismissed };
}

/** v1 → v2: sound was off by default and the games were silent, so it turns on once; music is new. */
export function migrateSettings(fromVersion: number, data: unknown): unknown {
  if (fromVersion === 1 && data && typeof data === "object") return { ...data, sound: true, music: true };
  throw new Error(`no migration from settings v${fromVersion}`);
}

const store = versionedStore(SETTINGS_KEY, SETTINGS_VERSION, parseSettings, DEFAULT_SETTINGS, migrateSettings);

export type SettingsState = Settings & { set(patch: Partial<Settings>): void };

const pick = (s: Settings): Settings => ({
  theme: s.theme,
  sound: s.sound,
  music: s.music,
  quality: s.quality,
  lite: s.lite,
  welcomeDismissed: s.welcomeDismissed,
});

export const useSettings = create<SettingsState>((setState, get) => ({
  ...store.load(),
  set(patch) {
    setState(patch);
    store.save(pick(get()));
  },
}));
