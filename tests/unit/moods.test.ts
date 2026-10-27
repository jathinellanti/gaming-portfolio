import { describe, it, expect, afterEach } from "vitest";
import { DEFAULT_MOOD, MOODS, setSectionActive } from "../../src/site/moods";
import { SECTIONS } from "../../src/site/nav-items";

const tone = (k: "a" | "b" | "c") => document.documentElement.style.getPropertyValue(`--tone-${k}`);

describe("section moods", () => {
  afterEach(() => {
    for (const s of SECTIONS) setSectionActive(s.id, false);
  });

  it("every section has three valid tones", () => {
    for (const s of SECTIONS) {
      const mood = MOODS[s.id];
      expect(mood.tones).toHaveLength(3);
      for (const t of mood.tones) expect(t).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
    }
  });

  it("the background takes the active section's tones, and the default when none is active", () => {
    setSectionActive("education", true);
    expect(tone("a")).toBe(`rgb(${MOODS.education.tones[0]})`);
    expect(tone("c")).toBe(`rgb(${MOODS.education.tones[2]})`);
    setSectionActive("education", false);
    expect(tone("a")).toBe(`rgb(${DEFAULT_MOOD.tones[0]})`);
  });

  it("the most recently entered section wins; leaving it hands back to the one still on screen", () => {
    setSectionActive("skills", true);
    setSectionActive("projects", true);
    expect(tone("b")).toBe(`rgb(${MOODS.projects.tones[1]})`);
    setSectionActive("projects", false);
    expect(tone("b")).toBe(`rgb(${MOODS.skills.tones[1]})`);
  });

  it("reporting the same section twice does not leave a stale entry", () => {
    setSectionActive("contact", true);
    setSectionActive("contact", true);
    setSectionActive("contact", false);
    expect(tone("a")).toBe(`rgb(${DEFAULT_MOOD.tones[0]})`);
  });
});
