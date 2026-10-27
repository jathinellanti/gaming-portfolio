import type { Surface } from "../../platform/audio";
import { B } from "./world/blocks";

// Which footstep a block makes underfoot.
const SURFACE: Partial<Record<number, Surface>> = {
  [B.GRASS]: "grass",
  [B.TALL_GRASS]: "grass",
  [B.FLOWER_RED]: "grass",
  [B.FLOWER_YELLOW]: "grass",
  [B.LEAVES]: "grass",
  [B.DIRT]: "dirt",
  [B.PATH]: "dirt",
  [B.SAND]: "sand",
  [B.GRAVEL]: "gravel",
  [B.LOG]: "wood",
  [B.PLANKS]: "wood",
  [B.BOOKSHELF]: "wood",
  [B.CRAFTING_TABLE]: "wood",
  [B.CHEST]: "wood",
  [B.LECTERN]: "wood",
  [B.FRAME]: "wood",
  [B.RUNE_TABLE]: "wood",
  [B.WOOL_RED]: "cloth",
  [B.WOOL_WHITE]: "cloth",
  [B.GLASS]: "glass",
  [B.WATER]: "water",
  [B.GOLD_BLOCK]: "metal",
  [B.LANTERN]: "metal",
  [B.SPAWNER]: "metal",
};

export function surfaceFor(blockId: number): Surface {
  return SURFACE[blockId] ?? "stone";
}
