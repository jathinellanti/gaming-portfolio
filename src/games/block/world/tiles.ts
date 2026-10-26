// Texture tiles in the 16×16-tile atlas. Pure data (no canvas) so the worker can
// compute UVs; atlas.ts paints the pixels on the main thread in this same order.
export const TILES = [
  "grass_top",
  "grass_side",
  "dirt",
  "stone",
  "cobble",
  "mossy_cobble",
  "sand",
  "gravel",
  "log_side",
  "log_top",
  "leaves",
  "planks",
  "glass",
  "bookshelf",
  "water",
  "gold_ore",
  "coal_ore",
  "brick",
  "stone_brick",
  "wool_red",
  "wool_white",
  "crafting_top",
  "crafting_side",
  "chest_top",
  "chest_side",
  "lectern_top",
  "lectern_side",
  "spawner",
  "obsidian",
  "portal",
  "lantern",
  "bedrock",
  "flower_red",
  "flower_yellow",
  "tall_grass",
  "gold_block",
  "rune_top",
  "rune_side",
  "frame",
  "path_top",
  "destroy_0",
  "destroy_1",
  "destroy_2",
  "destroy_3",
  "destroy_4",
  "destroy_5",
  "destroy_6",
  "destroy_7",
  "destroy_8",
  "destroy_9",
] as const;

export type TileName = (typeof TILES)[number];

export const TILE_INDEX = Object.fromEntries(TILES.map((t, i) => [t, i])) as Record<TileName, number>;

export const ATLAS_TILES_PER_ROW = 16;
export const TILE_PX = 16;
export const ATLAS_PX = ATLAS_TILES_PER_ROW * TILE_PX;

/** UV rectangle of a tile (texture flipY = true: canvas row 0 is v = 1), inset half a texel against bleeding. */
export function tileUV(index: number): [u0: number, v0: number, u1: number, v1: number] {
  const col = index % ATLAS_TILES_PER_ROW;
  const row = Math.floor(index / ATLAS_TILES_PER_ROW);
  const e = 0.5 / ATLAS_PX;
  const s = 1 / ATLAS_TILES_PER_ROW;
  return [col * s + e, 1 - (row + 1) * s + e, (col + 1) * s - e, 1 - row * s - e];
}
