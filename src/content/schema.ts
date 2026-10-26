import { z } from "zod";
import { SKILL_CATEGORIES } from "./model";

// The shape of every piece of portfolio content. Validation runs in the test gate
// (static data, before any deploy), in dev builds, and for any future API source.
// Pages import runtime helpers from model.ts so zod stays off the first-paint path.

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "use YYYY-MM");
const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "use a lowercase-kebab id");
const sitePath = z.string().startsWith("/", "must be a site path starting with /");

export const evidenceRef = z.object({
  kind: z.enum(["project", "achievement", "experience", "education"]),
  id: z.string(),
});

export const profileSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1).optional(),
  intro: z.string().min(20),
  about: z.array(z.string().min(20)).min(1),
  location: z.string().min(1),
  email: z.email(),
  links: z.object({
    github: z.url(),
    linkedin: z.url().optional(),
    codechef: z.url().optional(),
  }),
  cvPdf: sitePath,
  portrait: sitePath.optional(),
  lastUpdated: month,
});

const dated = { start: month, end: month.optional() };

export const educationSchema = z.object({
  id,
  institution: z.string().min(1),
  programme: z.string().min(1),
  location: z.string().min(1),
  ...dated,
  result: z.object({ label: z.string(), value: z.string() }).optional(),
});

export const experienceSchema = z.object({
  id,
  organisation: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  ...dated,
  summary: z.string().min(20),
  responsibilities: z.array(z.string()),
  skillsGained: z.array(z.string()),
  outcomes: z.array(z.string()),
});

export const skillSchema = z.object({
  id,
  name: z.string().min(1),
  category: z.enum(SKILL_CATEGORIES),
  level: z.enum(["learning", "working", "proficient", "expert"]).optional(),
  evidence: z.array(evidenceRef),
});

export const imageSchema = z.object({
  src: sitePath,
  alt: z.string().min(5),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const projectSchema = z.object({
  slug: id,
  title: z.string().min(1),
  summary: z.string().min(20),
  description: z.array(z.string().min(20)).min(1),
  kind: z.enum(["web", "game", "tool"]),
  context: z.enum(["personal", "academic-team", "team", "professional"]),
  role: z.string().min(1),
  contribution: z.array(z.string()),
  features: z.array(z.string()).min(1),
  status: z.enum(["completed", "in-progress", "archived"]).optional(),
  ...dated,
  tech: z.array(id).min(1),
  links: z.object({ repo: z.url().optional(), live: z.url().optional() }),
  images: z.array(imageSchema),
  game: z.object({ genre: z.string(), engine: z.string() }).optional(),
});

export const achievementSchema = z.object({
  id,
  title: z.string().min(1),
  issuer: z.string().min(1),
  kind: z.enum(["certification", "award", "milestone"]),
  date: month.optional(),
  credentialUrl: z.url().optional(),
  description: z.string().optional(),
});

export const caseStudySchema = z.object({
  id,
  title: z.string().min(1),
  projectSlug: id.optional(),
  verified: z.boolean(),
  encounter: z.string(),
  challenge: z.string(),
  strategy: z.array(z.string()).min(1),
  arsenal: z.array(id),
  outcome: z.string(),
  evidence: z.array(z.object({ label: z.string(), href: z.url().optional(), image: imageSchema.optional() })),
});

export const skillTreeNodeSchema = z.object({
  id,
  branch: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(20),
  evidence: z.array(evidenceRef).min(1),
  requires: z.array(id),
});

const baseContent = z.object({
  profile: profileSchema,
  education: z.array(educationSchema).min(1),
  experience: z.array(experienceSchema),
  skills: z.array(skillSchema).min(1),
  projects: z.array(projectSchema),
  achievements: z.array(achievementSchema),
  caseStudies: z.array(caseStudySchema),
  skillTree: z.array(skillTreeNodeSchema),
});

export const contentSchema = baseContent.superRefine((c, ctx) => {
  const ids = {
    project: new Set(c.projects.map((p) => p.slug)),
    achievement: new Set(c.achievements.map((a) => a.id)),
    experience: new Set(c.experience.map((e) => e.id)),
    education: new Set(c.education.map((e) => e.id)),
  };
  const skillIds = new Set(c.skills.map((s) => s.id));
  const nodeIds = new Set(c.skillTree.map((n) => n.id));

  const noDuplicates = (list: string[], path: string) => {
    const seen = new Set<string>();
    list.forEach((v, i) => {
      if (seen.has(v)) ctx.addIssue({ code: "custom", path: [path, i], message: `duplicate id "${v}"` });
      seen.add(v);
    });
  };
  noDuplicates(c.projects.map((p) => p.slug), "projects");
  noDuplicates(c.skills.map((s) => s.id), "skills");
  noDuplicates(c.achievements.map((a) => a.id), "achievements");
  noDuplicates(c.education.map((e) => e.id), "education");
  noDuplicates(c.experience.map((e) => e.id), "experience");
  noDuplicates(c.caseStudies.map((x) => x.id), "caseStudies");
  noDuplicates(c.skillTree.map((n) => n.id), "skillTree");

  const checkEvidence = (refs: { kind: keyof typeof ids; id: string }[], path: (string | number)[]) =>
    refs.forEach((r, i) => {
      if (!ids[r.kind].has(r.id))
        ctx.addIssue({ code: "custom", path: [...path, "evidence", i], message: `unknown ${r.kind} "${r.id}"` });
    });
  c.skills.forEach((s, i) => checkEvidence(s.evidence, ["skills", i]));
  c.skillTree.forEach((n, i) => {
    checkEvidence(n.evidence, ["skillTree", i]);
    n.requires.forEach((r, j) => {
      if (!nodeIds.has(r))
        ctx.addIssue({ code: "custom", path: ["skillTree", i, "requires", j], message: `unknown node "${r}"` });
    });
  });
  c.projects.forEach((p, i) =>
    p.tech.forEach((t, j) => {
      if (!skillIds.has(t))
        ctx.addIssue({ code: "custom", path: ["projects", i, "tech", j], message: `"${t}" is not a skill id in skills.ts` });
    }),
  );
  c.caseStudies.forEach((x, i) => {
    x.arsenal.forEach((t, j) => {
      if (!skillIds.has(t))
        ctx.addIssue({ code: "custom", path: ["caseStudies", i, "arsenal", j], message: `"${t}" is not a skill id` });
    });
    if (x.projectSlug && !ids.project.has(x.projectSlug))
      ctx.addIssue({ code: "custom", path: ["caseStudies", i, "projectSlug"], message: `unknown project "${x.projectSlug}"` });
  });

  const endAfterStart = (list: { start: string; end?: string }[], path: string) =>
    list.forEach((e, i) => {
      if (e.end && e.end < e.start) ctx.addIssue({ code: "custom", path: [path, i, "end"], message: "end is before start" });
    });
  endAfterStart(c.education, "education");
  endAfterStart(c.experience, "experience");
  endAfterStart(c.projects, "projects");
});

export type Content = z.infer<typeof baseContent>;
export type Profile = Content["profile"];
export type Education = Content["education"][number];
export type Experience = Content["experience"][number];
export type Skill = Content["skills"][number];
export type SkillCategory = Skill["category"];
export type Project = Content["projects"][number];
export type Achievement = Content["achievements"][number];
export type CaseStudy = Content["caseStudies"][number];
export type SkillTreeNode = Content["skillTree"][number];
export type EvidenceRef = z.infer<typeof evidenceRef>;

export type ValidationResult = { ok: true; content: Content } | { ok: false; issues: string[] };

export function validateContent(raw: unknown): ValidationResult {
  const r = contentSchema.safeParse(raw);
  if (r.success) return { ok: true, content: r.data };
  return { ok: false, issues: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
}

export { publicView, skillById, SKILL_CATEGORIES, SKILL_CATEGORY_LABELS } from "./model";
