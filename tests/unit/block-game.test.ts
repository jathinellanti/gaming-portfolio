import { describe, it, expect } from "vitest";
import { runCommand } from "../../src/games/block/ui/commands";
import { buildRecipes, buildBook, layoutAdvancements } from "../../src/games/block/content";
import { screenForBlock, breakTime } from "../../src/games/block/player/interact";
import { B } from "../../src/games/block/world/blocks";
import { TROPHY_FRAMES } from "../../src/games/block/world/structures";
import { realContent } from "./render";

describe("chat commands", () => {
  it("teleports by region name and alias", () => {
    expect(runCommand("/tp archive").action).toEqual({ type: "teleport", region: "archive" });
    expect(runCommand("/tp projects").action).toEqual({ type: "teleport", region: "crafting" });
    expect(runCommand("/spawn").action).toEqual({ type: "teleport", region: "spawn" });
  });
  it("teleports to coordinates within bounds and rejects outside", () => {
    expect(runCommand("/tp 10 40 -5").action).toEqual({ type: "teleportXYZ", x: 10, y: 40, z: -5 });
    expect(runCommand("/tp 10 400 -5").ok).toBe(false);
    expect(runCommand("/tp 99999 40 0").ok).toBe(false);
  });
  it("rejects unknown places and commands with guidance", () => {
    const r = runCommand("/tp mars");
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/Unknown place "mars"/);
    expect(runCommand("/fly").message).toMatch(/\/help/);
  });
  it("opens the CV, screens and sets time", () => {
    expect(runCommand("/cv").action).toEqual({ type: "navigate", to: "/cv" });
    expect(runCommand("/skills").action).toEqual({ type: "open", screen: "inventory" });
    expect(runCommand("/time set night").action).toEqual({ type: "time", value: 0.62 });
    expect(runCommand("/time set teatime").ok).toBe(false);
  });
  it("echoes plain chat and ignores empty input", () => {
    expect(runCommand("hello there").message).toBe("<Visitor> hello there");
    expect(runCommand("   ")).toEqual({ ok: false, message: "" });
  });
});

describe("CV → game mapping", () => {
  const c = realContent();
  it("one crafting recipe per project, ingredients are its real tech", () => {
    const recipes = buildRecipes(c);
    expect(recipes).toHaveLength(c.projects.length);
    const elms = recipes.find((r) => r.project.slug === "employee-leave-management")!;
    expect(elms.ingredients.map((s) => s.id)).toEqual(c.projects[1].tech);
    expect(elms.grid.filter(Boolean)).toHaveLength(8);
    expect(elms.grid[4]?.id).toBe("react"); // first ingredient sits in the centre
  });
  it("the book covers the bio, every education and experience entry, and contact", () => {
    const pages = buildBook(c);
    const text = JSON.stringify(pages);
    for (const e of c.education) expect(text).toContain(e.programme);
    for (const x of c.experience) expect(text).toContain(x.organisation);
    expect(pages[0].heading).toBe("Ellanti Jathin");
    expect(pages.at(-1)!.body).toContain("jathinellanti@gmail.com");
    expect(text).not.toMatch(/9182951536/);
  });
  it("lays out every skill-tree node, prerequisites in earlier columns", () => {
    const layout = layoutAdvancements(c.skillTree);
    expect(layout).toHaveLength(c.skillTree.length);
    const col = new Map(layout.map((l) => [l.node.id, l.col]));
    for (const l of layout) for (const r of l.node.requires) expect(col.get(r)!).toBeLessThan(l.col);
    const cells = new Set(layout.map((l) => `${l.col},${l.row}`));
    expect(cells.size).toBe(layout.length);
  });
  it("handles an empty skill tree and no projects", () => {
    expect(layoutAdvancements([])).toEqual([]);
    expect(buildRecipes({ ...c, projects: [] })).toEqual([]);
  });
});

describe("interactions", () => {
  it("maps each CV block to its screen", () => {
    expect(screenForBlock(B.LECTERN, 0, 0, 0)?.screen).toBe("book");
    expect(screenForBlock(B.CHEST, 0, 0, 0)?.screen).toBe("inventory");
    expect(screenForBlock(B.RUNE_TABLE, 0, 0, 0)?.screen).toBe("advancements");
    expect(screenForBlock(B.CRAFTING_TABLE, 0, 0, 0)?.screen).toBe("crafting");
    expect(screenForBlock(B.SPAWNER, 0, 0, 0)?.screen).toBe("dungeon");
    const [fx, fy, fz] = TROPHY_FRAMES[2];
    expect(screenForBlock(B.FRAME, fx, fy, fz)).toEqual({ screen: "trophies", arg: 2 });
    expect(screenForBlock(B.STONE, 0, 0, 0)).toBeNull();
  });
  it("break times: plants instant, soft < wood < stone, unbreakables infinite", () => {
    expect(breakTime(B.TALL_GRASS)).toBeLessThan(0.1);
    expect(breakTime(B.DIRT)).toBeLessThan(breakTime(B.PLANKS));
    expect(breakTime(B.PLANKS)).toBeLessThan(breakTime(B.STONE));
    expect(breakTime(B.BEDROCK)).toBe(Infinity);
    expect(breakTime(B.PORTAL)).toBe(Infinity);
  });
});
