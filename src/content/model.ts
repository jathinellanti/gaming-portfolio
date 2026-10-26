import type { Content, Skill } from "./schema";

// Runtime helpers and constants for content, with no validation library attached,
// so pages can use them without pulling zod into the first-paint bundle.
// Validation lives in schema.ts and runs in the test gate (and for future API sources).

export const SKILL_CATEGORIES = ["languages", "frameworks", "engines", "databases", "tools"] as const;

export const SKILL_CATEGORY_LABELS = {
  languages: "Programming Languages",
  frameworks: "Libraries & Frameworks",
  engines: "Game Engines",
  databases: "Databases",
  tools: "Tools & Platforms",
} as const satisfies Record<(typeof SKILL_CATEGORIES)[number], string>;

/** What visitors may see: unverified case studies never render (no-fabrication invariant). */
export const publicView = (c: Content): Content => ({ ...c, caseStudies: c.caseStudies.filter((x) => x.verified) });

export const skillById = (c: Content, sid: string): Skill | undefined => c.skills.find((s) => s.id === sid);
