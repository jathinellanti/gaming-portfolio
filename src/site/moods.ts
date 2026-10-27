import type { SectionId } from "./nav-items";

// Each section has its own atmosphere: three tone colours that the page-wide aurora
// cross-fades to while the section is on screen.

/** "r g b" channels, so the same tone works in rgb() and color-mix(). */
export type Tone = `${number} ${number} ${number}`;

export interface Mood {
  tones: [Tone, Tone, Tone];
}

export const DEFAULT_MOOD: Mood = { tones: ["34 211 238", "139 92 246", "59 130 246"] };

export const MOODS: Record<SectionId, Mood> = {
  about: DEFAULT_MOOD,
  education: { tones: ["245 158 11", "244 63 94", "139 92 246"] },
  experience: { tones: ["56 189 248", "99 102 241", "20 184 166"] },
  skills: { tones: ["16 185 129", "34 211 238", "59 130 246"] },
  projects: { tones: ["139 92 246", "217 70 239", "34 211 238"] },
  certifications: { tones: ["217 70 239", "124 58 237", "56 189 248"] },
  contact: { tones: ["99 102 241", "34 211 238", "168 85 247"] },
};

// Sections report when they cross the middle of the viewport; the most recent one
// wins, and with none active (hero, other pages) the default mood returns. Tones are
// written to <html> as registered colour properties, so CSS transitions blend them.
const active: SectionId[] = [];

export function setSectionActive(id: SectionId, on: boolean) {
  const i = active.indexOf(id);
  if (i >= 0) active.splice(i, 1);
  if (on) active.push(id);
  applyMood(active.length ? MOODS[active[active.length - 1]] : DEFAULT_MOOD);
}

function applyMood(mood: Mood) {
  const style = document.documentElement.style;
  mood.tones.forEach((t, i) => style.setProperty(`--tone-${"abc"[i]}`, `rgb(${t})`));
}
