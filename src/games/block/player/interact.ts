import { B, blockDef } from "../world/blocks";
import { TROPHY_FRAMES, type ScreenId } from "../world/structures";

// Which CV screen a block opens, and how long blocks take to break.

export function screenForBlock(id: number, x: number, y: number, z: number): { screen: ScreenId; arg: number | null } | null {
  switch (id) {
    case B.LECTERN:
      return { screen: "book", arg: null };
    case B.CHEST:
      return { screen: "inventory", arg: null };
    case B.RUNE_TABLE:
      return { screen: "advancements", arg: null };
    case B.CRAFTING_TABLE:
      return { screen: "crafting", arg: null };
    case B.SPAWNER:
      return { screen: "dungeon", arg: null };
    case B.FRAME: {
      const i = TROPHY_FRAMES.findIndex(([fx, fy, fz]) => fx === x && fy === y && fz === z);
      return { screen: "trophies", arg: i >= 0 ? i : null };
    }
    default:
      return null;
  }
}

const SOFT = new Set<number>([B.GRASS, B.DIRT, B.SAND, B.GRAVEL, B.PATH, B.LEAVES, B.TALL_GRASS, B.FLOWER_RED, B.FLOWER_YELLOW, B.GLASS, B.WOOL_RED, B.WOOL_WHITE, B.LANTERN]);
const WOOD = new Set<number>([B.LOG, B.PLANKS, B.BOOKSHELF, B.CRAFTING_TABLE, B.CHEST, B.LECTERN, B.FRAME]);

/** Seconds of holding the button to break a block (bare hand, simplified). */
export function breakTime(id: number): number {
  if (!blockDef(id).breakable) return Infinity;
  if (id === B.TALL_GRASS || id === B.FLOWER_RED || id === B.FLOWER_YELLOW) return 0.05;
  if (SOFT.has(id)) return 0.45;
  if (WOOD.has(id)) return 0.9;
  if (id === B.OBSIDIAN) return 3;
  return 1.25;
}
