import type { Content, Skill, SkillCategory, SkillTreeNode } from "../../content/schema";
import { byNewest, formatRange } from "../../site/format";

// CV → Neon City mechanics. Pure functions of content.

export interface CyberSlot {
  id: string;
  label: string;
  category: SkillCategory;
  blurb: string;
  /** Anchor on the body diagram (percent of the figure box). */
  anchor: [number, number];
}

export const CYBER_SLOTS: CyberSlot[] = [
  { id: "frontal-cortex", label: "Frontal Cortex", category: "languages", blurb: "Languages I think in", anchor: [50, 9] },
  { id: "operating-system", label: "Operating System", category: "engines", blurb: "Engines I build games on", anchor: [50, 30] },
  { id: "arms", label: "Arms", category: "frameworks", blurb: "Frameworks that do the heavy lifting", anchor: [22, 42] },
  { id: "nervous-system", label: "Nervous System", category: "databases", blurb: "Data I can recall", anchor: [50, 52] },
  { id: "hands", label: "Hands", category: "tools", blurb: "Tools always within reach", anchor: [78, 58] },
];

export function installedIn(c: Content, slot: CyberSlot): Skill[] {
  return c.skills.filter((s) => s.category === slot.category);
}

export interface LifeEntry {
  id: string;
  kind: "education" | "experience";
  title: string;
  org: string;
  when: string;
  start: string;
  detail: string[];
}

export function lifePath(c: Content): LifeEntry[] {
  const edu: LifeEntry[] = c.education.map((e) => ({
    id: e.id,
    kind: "education",
    title: e.programme,
    org: `${e.institution}, ${e.location}`,
    when: formatRange(e.start, e.end),
    start: e.start,
    detail: e.result ? [`${e.result.label}: ${e.result.value}`] : [],
  }));
  const exp: LifeEntry[] = c.experience.map((x) => ({
    id: x.id,
    kind: "experience",
    title: x.role,
    org: `${x.organisation}, ${x.location}`,
    when: formatRange(x.start, x.end),
    start: x.start,
    detail: [x.summary, ...x.outcomes],
  }));
  return [...edu, ...exp].sort(byNewest);
}

export interface PerkColumn {
  branch: string;
  nodes: SkillTreeNode[];
}

/** One column per branch; within a branch, prerequisites come first. */
export function perkColumns(nodes: SkillTreeNode[]): PerkColumn[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depth = (n: SkillTreeNode, seen = new Set<string>()): number => {
    if (seen.has(n.id) || n.requires.length === 0) return 0;
    seen.add(n.id);
    return 1 + Math.max(...n.requires.map((r) => (byId.get(r) ? depth(byId.get(r)!, seen) : 0)));
  };
  const branches = [...new Set(nodes.map((n) => n.branch))];
  return branches.map((branch) => ({ branch, nodes: nodes.filter((n) => n.branch === branch).sort((a, b) => depth(a) - depth(b)) }));
}
