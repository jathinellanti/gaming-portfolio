import type { Content, Project, Skill, SkillTreeNode } from "../../content/schema";
import { skillById } from "../../content/model";
import { formatMonth, formatRange, byNewest } from "../../site/format";

// How the real CV maps onto Block World mechanics. Pure functions of content.

/** Crafting-grid slot order: centre, then edges, then corners: symmetric for any count. */
const SLOT_ORDER = [4, 1, 7, 3, 5, 0, 2, 6, 8];

export interface Recipe {
  project: Project;
  grid: (Skill | null)[]; // 9 cells, row-major
  ingredients: Skill[];
}

export function buildRecipes(c: Content): Recipe[] {
  return c.projects.map((project) => {
    const ingredients = project.tech.map((t) => skillById(c, t)).filter((s): s is Skill => !!s);
    const grid: (Skill | null)[] = Array(9).fill(null);
    ingredients.slice(0, 9).forEach((s, i) => (grid[SLOT_ORDER[i]] = s));
    return { project, grid, ingredients };
  });
}

export interface BookPage {
  /** education/experience id this page presents, for evidence links. */
  ref?: string;
  heading: string;
  sub?: string;
  body: string[];
}

export function buildBook(c: Content): BookPage[] {
  const p = c.profile;
  const pages: BookPage[] = [
    { heading: p.name, sub: [p.title, p.subtitle].filter(Boolean).join(" · "), body: [p.intro, `Based in ${p.location}.`] },
    ...p.about.map((para, i) => ({ heading: i === 0 ? "About me" : "About me (cont.)", body: [para] })),
  ];
  for (const e of [...c.education].sort(byNewest))
    pages.push({ ref: e.id, heading: e.programme, sub: `${e.institution}, ${e.location}`, body: [formatRange(e.start, e.end), ...(e.result ? [`${e.result.label}: ${e.result.value}`] : [])] });
  for (const x of [...c.experience].sort(byNewest))
    pages.push({ ref: x.id, heading: `${x.role} · ${x.organisation}`, sub: `${x.location} · ${formatRange(x.start, x.end)}`, body: [x.summary, ...x.outcomes] });
  pages.push({ heading: "Write to me", body: [p.email, p.links.github.replace("https://", ""), `Last updated ${formatMonth(p.lastUpdated)}.`] });
  return pages;
}

export interface AdvancementNode {
  node: SkillTreeNode;
  col: number;
  row: number;
}

/** Tree layout: column = depth from a root, rows grouped by branch. */
export function layoutAdvancements(nodes: SkillTreeNode[]): AdvancementNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depthMemo = new Map<string, number>();
  const depth = (n: SkillTreeNode, seen = new Set<string>()): number => {
    if (depthMemo.has(n.id)) return depthMemo.get(n.id)!;
    if (seen.has(n.id)) return 0;
    seen.add(n.id);
    const d = n.requires.length === 0 ? 0 : 1 + Math.max(...n.requires.map((r) => (byId.get(r) ? depth(byId.get(r)!, seen) : 0)));
    depthMemo.set(n.id, d);
    return d;
  };
  const rowsPerCol = new Map<number, number>();
  const sorted = [...nodes].sort((a, b) => depth(a) - depth(b) || a.branch.localeCompare(b.branch));
  return sorted.map((node) => {
    const col = depth(node);
    const row = rowsPerCol.get(col) ?? 0;
    rowsPerCol.set(col, row + 1);
    return { node, col, row };
  });
}

/** Skills grouped for the creative-style inventory tabs, in display order. */
export const INVENTORY_TABS = [
  { id: "all", label: "All skills" },
  { id: "languages", label: "Languages" },
  { id: "frameworks", label: "Frameworks" },
  { id: "engines", label: "Engines" },
  { id: "databases", label: "Databases" },
  { id: "tools", label: "Tools" },
] as const;
