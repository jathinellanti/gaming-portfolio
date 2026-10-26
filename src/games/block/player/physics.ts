// Player movement against the voxel grid. Axis-separated sweeps in sub-steps
// (≤ 0.25 block each) so nothing tunnels, the way block games handle it.
// Pure: (body, input, dt, world queries) → new body.

export const PLAYER = { width: 0.6, height: 1.8, eye: 1.62, sneakEye: 1.5 } as const;
export const SPEED = { walk: 4.3, sprint: 5.6, sneak: 1.3, fly: 10.9, swim: 2.2 } as const;
const GRAVITY = 32;
const JUMP_V = 9.0;
const TERMINAL = 78;
const MAX_STEP = 0.25;

export interface Body {
  x: number;
  y: number; // feet
  z: number;
  vx: number;
  vy: number;
  vz: number;
  onGround: boolean;
  inWater: boolean;
}

export interface MoveInput {
  forward: number; // -1..1
  strafe: number; // -1..1 (right = +1)
  jump: boolean;
  sneak: boolean;
  sprint: boolean;
  fly: boolean;
  yaw: number; // radians, 0 = facing -Z
}

export interface WorldQuery {
  solid(x: number, y: number, z: number): boolean;
  water(x: number, y: number, z: number): boolean;
}

const HW = PLAYER.width / 2;

function collides(x: number, y: number, z: number, w: WorldQuery): boolean {
  const x0 = Math.floor(x - HW);
  const x1 = Math.floor(x + HW - 1e-6);
  const y0 = Math.floor(y);
  const y1 = Math.floor(y + PLAYER.height - 1e-6);
  const z0 = Math.floor(z - HW);
  const z1 = Math.floor(z + HW - 1e-6);
  for (let bx = x0; bx <= x1; bx++) for (let by = y0; by <= y1; by++) for (let bz = z0; bz <= z1; bz++) if (w.solid(bx, by, bz)) return true;
  return false;
}

/** Would standing at (x, z) at height y have a block underfoot? Used by sneak edge-guard. */
function supported(x: number, y: number, z: number, w: WorldQuery): boolean {
  return collides(x, y - 0.05, z, w);
}

export function stepBody(b: Body, input: MoveInput, dt: number, w: WorldQuery): Body {
  const s: Body = { ...b };
  dt = Math.min(dt, 0.1);
  s.inWater = w.water(Math.floor(s.x), Math.floor(s.y + 0.4), Math.floor(s.z));

  // Desired horizontal velocity from input, relative to yaw.
  const len = Math.hypot(input.forward, input.strafe) || 1;
  const f = input.forward / len;
  const r = input.strafe / len;
  const sin = Math.sin(input.yaw);
  const cos = Math.cos(input.yaw);
  const dirX = -sin * f + cos * r;
  const dirZ = -cos * f - sin * r;
  const speed = input.fly ? SPEED.fly : s.inWater ? SPEED.swim : input.sneak ? SPEED.sneak : input.sprint ? SPEED.sprint : SPEED.walk;
  const moving = input.forward !== 0 || input.strafe !== 0;
  const tx = moving ? dirX * speed : 0;
  const tz = moving ? dirZ * speed : 0;
  const accel = input.fly ? 10 : s.onGround ? 18 : s.inWater ? 6 : 4;
  const k = Math.min(1, accel * dt);
  s.vx += (tx - s.vx) * k;
  s.vz += (tz - s.vz) * k;

  // Vertical.
  if (input.fly) {
    const vt = input.jump ? SPEED.fly * 0.8 : input.sneak ? -SPEED.fly * 0.8 : 0;
    s.vy += (vt - s.vy) * Math.min(1, 10 * dt);
  } else if (s.inWater) {
    s.vy -= GRAVITY * 0.18 * dt;
    if (input.jump) s.vy = Math.min(s.vy + 30 * dt, 3.2);
    s.vy = Math.max(s.vy, -3.5);
  } else {
    if (input.jump && s.onGround) s.vy = JUMP_V;
    s.vy = Math.max(s.vy - GRAVITY * dt, -TERMINAL);
  }

  // Sweep each axis in sub-steps.
  const steps = Math.max(1, Math.ceil((Math.max(Math.abs(s.vx), Math.abs(s.vy), Math.abs(s.vz)) * dt) / MAX_STEP));
  const h = dt / steps;
  s.onGround = false;
  for (let i = 0; i < steps; i++) {
    // Y first so landing resolves before sliding.
    const ny = s.y + s.vy * h;
    if (collides(s.x, ny, s.z, w)) {
      if (s.vy < 0) {
        s.y = Math.floor(ny) + 1;
        s.onGround = true;
      } else {
        s.y = Math.floor(ny + PLAYER.height) - PLAYER.height - 1e-4;
      }
      s.vy = 0;
    } else s.y = ny;

    const guard = input.sneak && !input.fly && (s.onGround || supported(s.x, s.y, s.z, w));
    const nx = s.x + s.vx * h;
    if (collides(nx, s.y, s.z, w) || (guard && !supported(nx, s.y, s.z, w))) s.vx = 0;
    else s.x = nx;
    const nz = s.z + s.vz * h;
    if (collides(s.x, s.y, nz, w) || (guard && !supported(s.x, s.y, nz, w))) s.vz = 0;
    else s.z = nz;
  }
  if (!s.onGround && s.vy === 0 && supported(s.x, s.y, s.z, w)) s.onGround = true;
  return s;
}
