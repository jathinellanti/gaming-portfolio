import type { Content, EvidenceRef } from "../../../content/schema";
import { buildBook } from "../content";
import { TROPHY_FRAMES } from "../world/structures";
import { useBlock } from "../store";

// Evidence links stay inside the game when possible: a project opens its
// recipe, a certificate its trophy frame, a role or degree its book page.
export function openEvidence(c: Content, ref: EvidenceRef) {
  const st = useBlock.getState();
  switch (ref.kind) {
    case "project":
      st.open("crafting", ref.id);
      return;
    case "achievement": {
      const i = c.achievements.findIndex((a) => a.id === ref.id);
      st.open("trophies", i >= 0 && i < TROPHY_FRAMES.length ? i : null);
      return;
    }
    case "education":
    case "experience": {
      const page = buildBook(c).findIndex((p) => p.ref === ref.id);
      st.open("book", page >= 0 ? page : 0);
      return;
    }
  }
}

export function evidenceLabel(c: Content, ref: EvidenceRef): string {
  switch (ref.kind) {
    case "project":
      return c.projects.find((p) => p.slug === ref.id)?.title ?? ref.id;
    case "achievement":
      return c.achievements.find((a) => a.id === ref.id)?.title ?? ref.id;
    case "experience": {
      const x = c.experience.find((e) => e.id === ref.id);
      return x ? `${x.role}, ${x.organisation}` : ref.id;
    }
    case "education":
      return c.education.find((e) => e.id === ref.id)?.institution ?? ref.id;
  }
}
