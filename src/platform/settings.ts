import { create } from "zustand";
import { versionedStore } from "./storage";

const THEMES = ["dark", "light"] as const;
const QUALITIES = ["auto", "low", "medium", "high", "ultra"] as const;

export interface Settings {
  theme: (typeof THEMES)[number];
  sound: boolean;
  quality: (typeof QUALITIES)[number];
  lite: boolean;
  welcomeDismissed: boolean;
}
export type Theme = Settings["theme"];

export const SETTINGS_KEY = "jp.settings.v1";
export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  sound: false,
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
    !QUALITIES.includes(r.quality as Settings["quality"]) ||
    typeof r.lite !== "boolean" ||
    typeof r.welcomeDismissed !== "boolean"
  ) {
    throw new Error("stored settings have the wrong shape");
  }
  return { theme: r.theme as Theme, sound: r.sound, quality: r.quality as Settings["quality"], lite: r.lite, welcomeDismissed: r.welcomeDismissed };
}

const store = versionedStore(SETTINGS_KEY, 1, parseSettings, DEFAULT_SETTINGS);

export type SettingsState = Settings & { set(patch: Partial<Settings>): void };

const pick = (s: Settings): Settings => ({
  theme: s.theme,
  sound: s.sound,
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
