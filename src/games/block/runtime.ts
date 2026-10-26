import type { Body } from "./player/physics";
import type { RayHit } from "./player/raycast";
import type { ChunkManager } from "./world/ChunkManager";
import type { RegionId } from "./world/structures";
import { Input } from "./player/input";
import { initialBlockSave } from "./store";
import { REGIONS } from "./world/structures";

// Per-frame mutable game state shared by the 3D components and the HUD. Kept
// outside React on purpose: it changes 60 times a second.

const plaza = REGIONS[0].spawn;
const spawn = initialBlockSave.pos ?? [plaza[0], plaza[1], plaza[2], plaza[3], 0];

export const runtime = {
  input: new Input(),
  manager: null as ChunkManager | null,
  body: { x: spawn[0], y: spawn[1], z: spawn[2], vx: 0, vy: 0, vz: 0, onGround: false, inWater: false } as Body,
  yaw: spawn[3],
  pitch: spawn[4],
  fly: false,
  sneaking: false,
  sprinting: false,
  time: initialBlockSave.time,
  target: null as RayHit | null,
  targetBlock: 0,
  breakProgress: 0,
  region: null as RegionId | null,
  fps: 0,
  /** Set once the chunk under the player has been meshed. */
  ready: false,
  swing: 0,
};

export type Runtime = typeof runtime;

/** Day factor 0 (night) … 1 (noon) from time-of-day in [0,1) (0 = sunrise). */
export function daylight(time: number): number {
  const s = Math.sin(time * Math.PI * 2);
  return Math.min(1, Math.max(0, s * 1.6 + 0.25));
}
