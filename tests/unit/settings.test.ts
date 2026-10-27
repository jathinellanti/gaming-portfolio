import { describe, it, expect } from "vitest";
import { useSettings, DEFAULT_SETTINGS, SETTINGS_KEY, SETTINGS_VERSION, parseSettings, migrateSettings } from "../../src/platform/settings";
import { applyTheme } from "../../src/platform/theme";

describe("settings", () => {
  it("defaults: dark theme, sound and music on, auto quality, lite off", () => {
    const s = useSettings.getState();
    expect([s.theme, s.sound, s.music, s.quality, s.lite]).toEqual(["dark", true, true, "auto", false]);
  });

  it("set() updates state and persists only data fields", () => {
    useSettings.getState().set({ theme: "light" });
    expect(useSettings.getState().theme).toBe("light");
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY)!);
    expect(stored).toEqual({ v: SETTINGS_VERSION, data: { ...DEFAULT_SETTINGS, theme: "light" } });
    useSettings.getState().set({ theme: "dark" });
  });

  it("parseSettings accepts exactly a Settings object and strips extras", () => {
    expect(parseSettings({ ...DEFAULT_SETTINGS, extra: 1 })).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ ...DEFAULT_SETTINGS, quality: "ultra" }).quality).toBe("ultra");
  });

  it("parseSettings rejects wrong shapes", () => {
    expect(() => parseSettings(null)).toThrow();
    expect(() => parseSettings("dark")).toThrow();
    expect(() => parseSettings({ ...DEFAULT_SETTINGS, theme: "purple" })).toThrow();
    expect(() => parseSettings({ ...DEFAULT_SETTINGS, sound: "yes" })).toThrow();
    const { music: _music, ...noMusic } = DEFAULT_SETTINGS;
    expect(() => parseSettings(noMusic)).toThrow();
    const { lite: _lite, ...missing } = DEFAULT_SETTINGS;
    expect(() => parseSettings(missing)).toThrow();
  });

  it("v1 settings migrate to v2 keeping the visitor's choices, with sound on and music added", () => {
    const v1 = { theme: "light", sound: false, quality: "high", lite: true, welcomeDismissed: true };
    expect(parseSettings(migrateSettings(1, v1))).toEqual({ ...v1, sound: true, music: true });
    expect(() => migrateSettings(0, v1)).toThrow();
    expect(() => migrateSettings(1, null)).toThrow();
  });

  it("applyTheme sets data-theme and color-scheme", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
