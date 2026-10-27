import { FpsInput } from "../../platform/fpsInput";
import type { Car, Walker } from "./player/physics";
import { CAR_SPAWNS, SPAWN, type Box2 } from "./world/layout";

// Mutable per-frame state, outside React on purpose: it changes 60 times a second.
export const cityRuntime = {
  input: new FpsInput(),
  player: { x: SPAWN.x, z: SPAWN.z, y: 0, vy: 0, onGround: true, facing: SPAWN.yaw, speed: 0 } as Walker,
  cars: CAR_SPAWNS.map((s) => ({ x: s.x, z: s.z, heading: s.heading, vx: 0, vz: 0, steer: 0 })) as Car[],
  /** Index of the car being driven, or -1 on foot. */
  driving: -1,
  /** Nearest car within reach on foot, or -1. */
  nearCar: -1,
  camYaw: SPAWN.yaw,
  camPitch: 0.28,
  /** km/h of the driven car (HUD speedometer). */
  speedKmh: 0,
  fps: 60,
  /** Set by Player when a key-press request (enter/exit car) is pending. */
  useQueued: false,
  /** A marker the player is standing in, already announced. */
  inMarker: null as string | null,
  /** AI traffic this frame, as boxes the player's car and body collide with. */
  trafficBoxes: [] as Box2[],
  /** AI traffic positions this frame (minimap). */
  trafficDots: [] as [number, number][],
};

export type CityRuntime = typeof cityRuntime;
