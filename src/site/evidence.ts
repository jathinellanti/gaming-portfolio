import type { Content, EvidenceRef } from "../content/schema";

/** Where a piece of evidence lives on the site, and what to call it. */
export function evidenceLink(c: Content, ref: EvidenceRef): { href: string; label: string } {
  switch (ref.kind) {
    case "project": {
      const p = c.projects.find((x) => x.slug === ref.id);
      return { href: `/projects/${ref.id}`, label: p?.title ?? ref.id };
    }
    case "achievement": {
      const a = c.achievements.find((x) => x.id === ref.id);
      return { href: "/#certifications", label: a?.title ?? ref.id };
    }
    case "experience": {
      const e = c.experience.find((x) => x.id === ref.id);
      return { href: "/#experience", label: e ? `${e.role}, ${e.organisation}` : ref.id };
    }
    case "education": {
      const e = c.education.find((x) => x.id === ref.id);
      return { href: "/#education", label: e?.institution ?? ref.id };
    }
  }
}

export const CONTEXT_LABEL = {
  personal: "Personal project",
  "academic-team": "Team project (academic)",
  team: "Team project",
  professional: "Professional work",
} as const;
