import { rawContent } from "./data";
import { publicView } from "./model";
import type { Content } from "./schema";
import { raise } from "../platform/faults";

// The backend seam: today content is static; later an ApiContentSource can
// implement the same interface and be swapped in here without touching pages or games.
export interface ContentSource {
  load(): Promise<Content>;
}

export class StaticContentSource implements ContentSource {
  constructor(private readonly raw: unknown = rawContent) {}

  async load(): Promise<Content> {
    // Static content is compiled in and validated by `npm test` (content.test.ts)
    // before any deploy, so production skips re-validating it and keeps zod out of
    // the first-paint bundle. Dev and test builds validate on every load.
    if (import.meta.env.PROD) return publicView(this.raw as Content);
    const { validateContent } = await import("./schema");
    const r = validateContent(this.raw);
    if (!r.ok) {
      raise("content.invalid", { issues: r.issues });
      throw new Error(`Invalid content:\n${r.issues.join("\n")}`);
    }
    return publicView(r.content);
  }
}

export const contentSource: ContentSource = new StaticContentSource();
