import type { Box2 } from "../world/city";

// First-person walker on a flat street grid: circle (r = 0.35) vs tower AABBs,
// resolved per axis in sub-steps so it slides along walls and never tunnels.

export const RADIUS = 0.35;
export const EYE = 1.68;
const WALK = 4.2;
const SPRINT = 7.2;
const GRAVITY = 22;
const JUMP_V = 6.2;
const MAX_STEP = 0.2;

export interface Walker {
  x: number;
  y: number;
  z: number;
  vy: number;
  onGround: boolean;
}

export interface WalkInput {
  forward: number;
  strafe: number;
  yaw: number;
  sprint: boolean;
  jump: boolean;
}

function overlaps(x: number, z: number, b: Box2): boolean {
  const cx = Math.max(b.minX, Math.min(x, b.maxX));
  const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
  return (x - cx) ** 2 + (z - cz) ** 2 < RADIUS * RADIUS;
}

function blocked(x: number, z: number, boxes: Box2[], bound: number): boolean {
  if (Math.abs(x) > bound - RADIUS || Math.abs(z) > bound - RADIUS) return true;
  for (const b of boxes) if (overlaps(x, z, b)) return true;
  return false;
}

export function stepWalker(w: Walker, input: WalkInput, dt: number, boxes: Box2[], bound: number): Walker {
  const s = { ...w };
  dt = Math.min(dt, 0.1);
  const len = Math.hypot(input.forward, input.strafe);
  const f = len > 1 ? input.forward / len : input.forward;
  const r = len > 1 ? input.strafe / len : input.strafe;
  const sin = Math.sin(input.yaw);
  const cos = Math.cos(input.yaw);
  const speed = input.sprint && f > 0 ? SPRINT : WALK;
  const vx = (-sin * f + cos * r) * speed;
  const vz = (-cos * f - sin * r) * speed;

  if (input.jump && s.onGround) {
    s.vy = JUMP_V;
    s.onGround = false;
  }
  s.vy -= GRAVITY * dt;
  s.y += s.vy * dt;
  if (s.y <= 0) {
    s.y = 0;
    s.vy = 0;
    s.onGround = true;
  }

  const steps = Math.max(1, Math.ceil((Math.hypot(vx, vz) * dt) / MAX_STEP));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    const nx = s.x + vx * h;
    if (!blocked(nx, s.z, boxes, bound)) s.x = nx;
    const nz = s.z + vz * h;
    if (!blocked(s.x, nz, boxes, bound)) s.z = nz;
  }
  return s;
}
