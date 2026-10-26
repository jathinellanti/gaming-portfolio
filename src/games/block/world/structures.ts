import { B } from "./blocks";

// The spawn village: one building per CV region (spec §4.2 A–H), built from
// block-placement programs. Pure data, shared by the worker (terrain) and the
// main thread (regions, protection, interaction).

export const GROUND_Y = 33; // top surface block inside the village
const F = GROUND_Y + 1; // first block above ground

export type RegionId = "spawn" | "archive" | "armory" | "shrine" | "crafting" | "dungeon" | "trophies" | "exit";
export type ScreenId = "book" | "inventory" | "advancements" | "crafting" | "dungeon" | "trophies" | "exit";

export interface Region {
  id: RegionId;
  name: string;
  subtitle: string;
  /** Screen opened by the region's interactive block (none for spawn). */
  screen?: ScreenId;
  /** Teleport/fast-travel target: feet position and yaw (0 = facing -Z). */
  spawn: [x: number, y: number, z: number, yaw: number];
  /** Protected volume (inclusive block coords). */
  box: [x0: number, y0: number, z0: number, x1: number, y1: number, z1: number];
  /** Where the building's sign hangs (block coords) and which way it faces (+z = 1, -z = -1). */
  sign?: [x: number, y: number, z: number, facing: 1 | -1];
}

const NORTH = 0; // looking -Z
const SOUTH = Math.PI; // looking +Z

export const REGIONS: Region[] = [
  { id: "spawn", name: "Spawn", subtitle: "Welcome to Jathincraft", spawn: [0.5, F, 8.5, NORTH], box: [-4, GROUND_Y, -4, 4, GROUND_Y + 6, 4] },
  { id: "archive", name: "The Archive", subtitle: "Who I am, where I studied, where I've worked", screen: "book", spawn: [-19.5, F, -5.5, NORTH], box: [-25, GROUND_Y, -21, -15, GROUND_Y + 10, -11], sign: [-20, F + 5, -11, 1] },
  { id: "armory", name: "The Armory", subtitle: "Skills, tools & languages", screen: "inventory", spawn: [19.5, F, -5.5, NORTH], box: [15, GROUND_Y, -21, 25, GROUND_Y + 10, -11], sign: [20, F + 5, -11, 1] },
  { id: "shrine", name: "Advancement Shrine", subtitle: "The skill tree", screen: "advancements", spawn: [0.5, F, -18.5, NORTH], box: [-5, GROUND_Y, -33, 5, GROUND_Y + 9, -24], sign: [0, F + 5, -24, 1] },
  { id: "crafting", name: "Crafting Hall", subtitle: "Projects, crafted from skills", screen: "crafting", spawn: [19.5, F, 6.5, SOUTH], box: [15, GROUND_Y, 11, 25, GROUND_Y + 10, 21], sign: [20, F + 5, 11, -1] },
  { id: "dungeon", name: "The Dungeon", subtitle: "Boss encounters: technical case studies", screen: "dungeon", spawn: [-19.5, F, 6.5, SOUTH], box: [-25, GROUND_Y - 1, 11, -15, GROUND_Y + 9, 21], sign: [-20, F + 5, 11, -1] },
  { id: "trophies", name: "Hall of Trophies", subtitle: "Certifications & achievements", screen: "trophies", spawn: [0.5, F, 17.5, SOUTH], box: [-6, GROUND_Y, 23, 6, GROUND_Y + 10, 33], sign: [0, F + 5, 23, -1] },
  { id: "exit", name: "The Exit Gate", subtitle: "Contact & CV", screen: "exit", spawn: [-9.5, F, 12.5, NORTH], box: [-13, GROUND_Y, 7, -6, GROUND_Y + 7, 9] },
];

export const regionById = (id: RegionId) => REGIONS.find((r) => r.id === id)!;

/** Trophy frames, left to right; each maps to achievements[i] (if any). */
export const TROPHY_FRAMES: [number, number, number][] = [-4, -2, 0, 2, 4].map((x) => [x, F + 1, 32]);

export const PORTAL_BOX: [number, number, number, number, number, number] = [-11, F, 8, -8, F + 2, 8];

/** The plaza guide NPC (feet position): first thing a new player sees. */
export const GUIDE_POS: [number, number, number] = [-2.5, F, -1.5];

// ---------------------------------------------------------------- builder

const pack = (x: number, y: number, z: number) => ((x + 1024) & 2047) | (((z + 1024) & 2047) << 11) | (y << 22);

class Builder {
  readonly blocks = new Map<number, [number, number, number, number]>();
  set(x: number, y: number, z: number, id: number) {
    this.blocks.set(pack(x, y, z), [x, y, z, id]);
  }
  fill(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, id: number) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) this.set(x, y, z, id);
  }
  /** Walls (and corner pillars) of a room, interior cleared, floor and flat roof. */
  room(x0: number, z0: number, x1: number, z1: number, height: number, o: { wall: number; floor: number; roof: number; pillar?: number }) {
    this.fill(x0, GROUND_Y, z0, x1, GROUND_Y, z1, o.floor);
    this.fill(x0, F, z0, x1, F + height - 1, z1, o.wall);
    this.fill(x0 + 1, F, z0 + 1, x1 - 1, F + height - 1, z1 - 1, B.AIR);
    if (o.pillar) for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) this.fill(x, F, z, x, F + height - 1, z, o.pillar);
    this.fill(x0, F + height, z0, x1, F + height, z1, o.roof);
    this.fill(x0 + 1, F + height + 1, z0 + 1, x1 - 1, F + height + 1, z1 - 1, o.roof);
  }
  door(x: number, z: number) {
    this.fill(x, F, z, x, F + 1, z, B.AIR);
    for (const dx of [-2, 2]) this.fill(x + dx, F + 1, z, x + dx, F + 2, z, B.GLASS);
  }
  path(x0: number, z0: number, x1: number, z1: number) {
    this.fill(x0, GROUND_Y, z0, x1, GROUND_Y, z1, B.PATH);
    this.fill(x0, F, z0, x1, F + 2, z1, B.AIR);
  }
  lanternPost(x: number, z: number) {
    this.fill(x, F, z, x, F + 1, z, B.LOG);
    this.set(x, F + 2, z, B.LANTERN);
  }
}

function buildVillage(): Builder {
  const b = new Builder();

  // Plaza + paths to every door
  b.fill(-3, GROUND_Y, -3, 3, GROUND_Y, 3, B.COBBLE);
  b.fill(-3, F, -3, 3, F + 3, 3, B.AIR);
  b.fill(0, F, 0, 0, F + 1, 0, B.STONE_BRICK);
  b.set(0, F + 2, 0, B.LANTERN);
  b.path(-1, -23, 1, -4); // north → shrine
  b.path(-20, -10, -16, -9); // archive approach
  b.path(16, -10, 20, -9);
  b.path(-20, -10, -18, -4);
  b.path(-18, -4, 18, -4); // east-west avenue (north)
  b.path(18, -10, 20, -4);
  b.path(-20, 4, 20, 4); // avenue (south)
  b.path(-1, 4, 1, 22); // south → trophies
  b.path(-20, 4, -18, 10);
  b.path(18, 4, 20, 10);
  b.path(-4, -1, -4, 1);
  b.path(4, -1, 4, 1);
  b.path(-4, 1, -4, 4);
  b.path(4, 1, 4, 4);
  b.path(-1, -4, 1, -3);
  b.path(-1, 3, 1, 4);
  b.path(-10, 4, -9, 11); // to the exit gate
  for (const [x, z] of [[-6, -6], [6, -6], [-6, 6], [6, 6], [-12, -6], [12, -6], [-12, 6], [12, 6], [3, -16], [3, 14]]) b.lanternPost(x, z);

  // A+B: The Archive (library)
  b.room(-24, -20, -16, -12, 5, { wall: B.PLANKS, floor: B.PLANKS, roof: B.STONE_BRICK, pillar: B.LOG });
  b.fill(-23, F, -19, -17, F + 2, -19, B.BOOKSHELF);
  b.fill(-23, F, -18, -23, F + 2, -14, B.BOOKSHELF);
  b.fill(-17, F, -18, -17, F + 2, -14, B.BOOKSHELF);
  b.set(-20, F, -16, B.LECTERN);
  b.fill(-24, F + 2, -17, -24, F + 3, -15, B.GLASS);
  b.fill(-16, F + 2, -17, -16, F + 3, -15, B.GLASS);
  b.set(-22, F + 4, -13, B.LANTERN);
  b.set(-18, F + 4, -13, B.LANTERN);
  b.door(-20, -12);

  // C: The Armory
  b.room(16, -20, 24, -12, 5, { wall: B.STONE_BRICK, floor: B.COBBLE, roof: B.COBBLE, pillar: B.COBBLE });
  for (const x of [18, 20, 22]) b.set(x, F, -19, B.CHEST);
  b.set(17, F, -16, B.CHEST);
  b.set(23, F, -16, B.CHEST);
  b.fill(16, F + 2, -17, 16, F + 3, -15, B.GLASS);
  b.fill(24, F + 2, -17, 24, F + 3, -15, B.GLASS);
  b.set(18, F + 4, -13, B.LANTERN);
  b.set(22, F + 4, -13, B.LANTERN);
  b.door(20, -12);

  // D: Advancement Shrine (open temple around a rune table)
  b.fill(-4, GROUND_Y, -32, 4, GROUND_Y, -25, B.STONE_BRICK);
  b.fill(-4, F, -32, 4, F + 7, -25, B.AIR);
  b.fill(-1, F, -29, 1, F, -27, B.OBSIDIAN);
  b.set(0, F + 1, -28, B.RUNE_TABLE);
  for (const [x, z] of [[-3, -31], [3, -31], [-3, -26], [3, -26]]) {
    b.fill(x, F, z, x, F + 4, z, B.STONE_BRICK);
    b.set(x, F + 5, z, B.LANTERN);
  }
  b.fill(-3, F + 6, -31, 3, F + 6, -26, B.STONE_BRICK);
  b.fill(-2, F, -31, 2, F + 1, -31, B.BOOKSHELF);
  b.fill(-3, F, -30, -3, F + 1, -27, B.BOOKSHELF);
  b.fill(3, F, -30, 3, F + 1, -27, B.BOOKSHELF);

  // E: Crafting Hall
  b.room(16, 12, 24, 20, 5, { wall: B.BRICK, floor: B.PLANKS, roof: B.PLANKS, pillar: B.LOG });
  for (const x of [18, 20, 22]) b.set(x, F, 17, B.CRAFTING_TABLE);
  b.fill(16, F + 2, 15, 16, F + 3, 17, B.GLASS);
  b.fill(24, F + 2, 15, 24, F + 3, 17, B.GLASS);
  b.set(18, F + 4, 19, B.LANTERN);
  b.set(22, F + 4, 19, B.LANTERN);
  b.door(20, 12);

  // F: The Dungeon (mossy crypt with a spawner on a dais)
  b.room(-24, 12, -16, 20, 5, { wall: B.MOSSY_COBBLE, floor: B.COBBLE, roof: B.MOSSY_COBBLE, pillar: B.COBBLE });
  b.fill(-23, GROUND_Y, 13, -17, GROUND_Y, 19, B.MOSSY_COBBLE);
  b.fill(-21, F, 15, -19, F, 17, B.OBSIDIAN);
  b.set(-20, F + 1, 16, B.SPAWNER);
  b.set(-23, F + 4, 13, B.LANTERN);
  b.set(-17, F + 4, 13, B.LANTERN);
  b.door(-20, 12);

  // G: Hall of Trophies
  b.room(-5, 24, 5, 32, 5, { wall: B.WOOL_WHITE, floor: B.STONE_BRICK, roof: B.STONE_BRICK, pillar: B.GOLD_BLOCK });
  for (const [x, y, z] of TROPHY_FRAMES) b.set(x, y, z, B.FRAME);
  b.fill(-4, F + 4, 31, 4, F + 4, 31, B.GOLD_BLOCK);
  b.set(-3, F + 4, 25, B.LANTERN);
  b.set(3, F + 4, 25, B.LANTERN);
  b.door(0, 24);

  // H: Exit Gate (obsidian frame, portal inside)
  b.fill(-12, F - 1, 8, -7, F + 3, 8, B.OBSIDIAN);
  b.fill(PORTAL_BOX[0], PORTAL_BOX[1], PORTAL_BOX[2], PORTAL_BOX[3], PORTAL_BOX[4], PORTAL_BOX[5], B.PORTAL);

  return b;
}

/** Structure blocks grouped by chunk: "cx,cz" → flat [x, y, z, id, ...] in world coords. */
export const STRUCTURE_BLOCKS: Map<string, number[]> = (() => {
  const out = new Map<string, number[]>();
  for (const [x, y, z, id] of buildVillage().blocks.values()) {
    const key = `${Math.floor(x / 16)},${Math.floor(z / 16)}`;
    let arr = out.get(key);
    if (!arr) out.set(key, (arr = []));
    arr.push(x, y, z, id);
  }
  return out;
})();

export function inBox(x: number, y: number, z: number, b: Region["box"]): boolean {
  return x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5];
}

/** Buildings can't be broken or built into: they hold the CV. */
export function isProtected(x: number, y: number, z: number): boolean {
  return REGIONS.some((r) => inBox(x, y, z, r.box)) || STRUCTURE_BLOCKS.has(`${Math.floor(x / 16)},${Math.floor(z / 16)}`) && isPathOrPlaza(x, y, z);
}

function isPathOrPlaza(x: number, y: number, z: number): boolean {
  if (y !== GROUND_Y) return false;
  const arr = STRUCTURE_BLOCKS.get(`${Math.floor(x / 16)},${Math.floor(z / 16)}`)!;
  for (let i = 0; i < arr.length; i += 4) if (arr[i] === x && arr[i + 1] === y && arr[i + 2] === z) return arr[i + 3] === B.PATH || arr[i + 3] === B.COBBLE;
  return false;
}

/** Which region (if any) contains this point (feet position). */
export function regionAt(x: number, y: number, z: number): Region | undefined {
  const bx = Math.floor(x);
  const by = Math.floor(y);
  const bz = Math.floor(z);
  return REGIONS.find((r) => r.id !== "spawn" && inBox(bx, by, bz, r.box)) ?? (inBox(bx, by, bz, REGIONS[0].box) ? REGIONS[0] : undefined);
}
