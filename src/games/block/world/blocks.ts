import { TILE_INDEX, type TileName } from "./tiles";

// Block registry. `bucket` decides which mesh/material a block renders into:
//  opaque   full cube, culls neighbours
//  cutout   alpha-tested cube (leaves, glass, spawner): neighbours still draw against it
//  cross    two diagonal quads (plants), in the cutout mesh
//  water    translucent liquid, lowered top surface
//  emissive full-bright cube that ignores day/night (lanterns, portal)
export const B = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  COBBLE: 4,
  MOSSY_COBBLE: 5,
  SAND: 6,
  GRAVEL: 7,
  LOG: 8,
  LEAVES: 9,
  PLANKS: 10,
  GLASS: 11,
  BOOKSHELF: 12,
  WATER: 13,
  GOLD_ORE: 14,
  COAL_ORE: 15,
  BRICK: 16,
  STONE_BRICK: 17,
  WOOL_RED: 18,
  WOOL_WHITE: 19,
  CRAFTING_TABLE: 20,
  CHEST: 21,
  LECTERN: 22,
  SPAWNER: 23,
  OBSIDIAN: 24,
  PORTAL: 25,
  LANTERN: 26,
  BEDROCK: 27,
  FLOWER_RED: 28,
  FLOWER_YELLOW: 29,
  TALL_GRASS: 30,
  GOLD_BLOCK: 31,
  RUNE_TABLE: 32,
  FRAME: 33,
  PATH: 34,
} as const;

export type BlockId = (typeof B)[keyof typeof B];
export type Bucket = "none" | "opaque" | "cutout" | "cross" | "water" | "emissive";

export interface BlockDef {
  name: string;
  bucket: Bucket;
  /** Collides with the player. */
  solid: boolean;
  top: number;
  side: number;
  bottom: number;
  /** Can be broken by the player (outside protected buildings). */
  breakable: boolean;
}

const t = (n: TileName) => TILE_INDEX[n];
const cube = (name: string, tile: TileName, bucket: Bucket = "opaque"): BlockDef => ({ name, bucket, solid: true, top: t(tile), side: t(tile), bottom: t(tile), breakable: true });

const DEFS: Record<number, BlockDef> = {
  [B.AIR]: { name: "Air", bucket: "none", solid: false, top: 0, side: 0, bottom: 0, breakable: false },
  [B.GRASS]: { name: "Grass Block", bucket: "opaque", solid: true, top: t("grass_top"), side: t("grass_side"), bottom: t("dirt"), breakable: true },
  [B.DIRT]: cube("Dirt", "dirt"),
  [B.STONE]: cube("Stone", "stone"),
  [B.COBBLE]: cube("Cobblestone", "cobble"),
  [B.MOSSY_COBBLE]: cube("Mossy Cobblestone", "mossy_cobble"),
  [B.SAND]: cube("Sand", "sand"),
  [B.GRAVEL]: cube("Gravel", "gravel"),
  [B.LOG]: { name: "Oak Log", bucket: "opaque", solid: true, top: t("log_top"), side: t("log_side"), bottom: t("log_top"), breakable: true },
  [B.LEAVES]: cube("Oak Leaves", "leaves", "cutout"),
  [B.PLANKS]: cube("Oak Planks", "planks"),
  [B.GLASS]: cube("Glass", "glass", "cutout"),
  [B.BOOKSHELF]: { name: "Bookshelf", bucket: "opaque", solid: true, top: t("planks"), side: t("bookshelf"), bottom: t("planks"), breakable: true },
  [B.WATER]: { name: "Water", bucket: "water", solid: false, top: t("water"), side: t("water"), bottom: t("water"), breakable: false },
  [B.GOLD_ORE]: cube("Gold Ore", "gold_ore"),
  [B.COAL_ORE]: cube("Coal Ore", "coal_ore"),
  [B.BRICK]: cube("Bricks", "brick"),
  [B.STONE_BRICK]: cube("Stone Bricks", "stone_brick"),
  [B.WOOL_RED]: cube("Red Wool", "wool_red"),
  [B.WOOL_WHITE]: cube("White Wool", "wool_white"),
  [B.CRAFTING_TABLE]: { name: "Crafting Table", bucket: "opaque", solid: true, top: t("crafting_top"), side: t("crafting_side"), bottom: t("planks"), breakable: true },
  [B.CHEST]: { name: "Chest", bucket: "opaque", solid: true, top: t("chest_top"), side: t("chest_side"), bottom: t("chest_top"), breakable: true },
  [B.LECTERN]: { name: "Lectern", bucket: "opaque", solid: true, top: t("lectern_top"), side: t("lectern_side"), bottom: t("planks"), breakable: true },
  [B.SPAWNER]: cube("Spawner", "spawner", "cutout"),
  [B.OBSIDIAN]: cube("Obsidian", "obsidian"),
  [B.PORTAL]: { name: "Exit Portal", bucket: "emissive", solid: false, top: t("portal"), side: t("portal"), bottom: t("portal"), breakable: false },
  [B.LANTERN]: cube("Lantern", "lantern", "emissive"),
  [B.BEDROCK]: { ...cube("Bedrock", "bedrock"), breakable: false },
  [B.FLOWER_RED]: { name: "Poppy", bucket: "cross", solid: false, top: t("flower_red"), side: t("flower_red"), bottom: t("flower_red"), breakable: true },
  [B.FLOWER_YELLOW]: { name: "Dandelion", bucket: "cross", solid: false, top: t("flower_yellow"), side: t("flower_yellow"), bottom: t("flower_yellow"), breakable: true },
  [B.TALL_GRASS]: { name: "Grass", bucket: "cross", solid: false, top: t("tall_grass"), side: t("tall_grass"), bottom: t("tall_grass"), breakable: true },
  [B.GOLD_BLOCK]: cube("Block of Gold", "gold_block"),
  [B.RUNE_TABLE]: { name: "Rune Table", bucket: "opaque", solid: true, top: t("rune_top"), side: t("rune_side"), bottom: t("obsidian"), breakable: true },
  [B.FRAME]: { name: "Trophy Frame", bucket: "opaque", solid: true, top: t("planks"), side: t("frame"), bottom: t("planks"), breakable: true },
  [B.PATH]: { name: "Dirt Path", bucket: "opaque", solid: true, top: t("path_top"), side: t("dirt"), bottom: t("dirt"), breakable: true },
};

export const BLOCK_IDS = Object.keys(DEFS).map(Number) as BlockId[];

export function blockDef(id: number): BlockDef {
  return DEFS[id] ?? DEFS[B.AIR];
}

/** Hides the faces of neighbours (only full opaque and emissive cubes do). */
export function isOccluder(id: number): boolean {
  const b = blockDef(id).bucket;
  return b === "opaque" || b === "emissive";
}

export function isSolid(id: number): boolean {
  return blockDef(id).solid;
}

/** Blocks that open a CV screen when right-clicked. */
export const INTERACTIVE = new Set<number>([B.LECTERN, B.CHEST, B.CRAFTING_TABLE, B.RUNE_TABLE, B.SPAWNER, B.FRAME]);

/** Blocks the hotbar can place (decorative building set). */
export const PLACEABLE: BlockId[] = [B.PLANKS, B.COBBLE, B.STONE_BRICK, B.BRICK, B.GLASS, B.LOG, B.LANTERN, B.WOOL_RED, B.GOLD_BLOCK];
