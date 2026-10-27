import type { Box2 } from "../world/layout";

// Pure movement for SUNSET BAY: a third-person walker and an arcade car.
// Convention: heading θ means forward = (cos θ, sin θ) in x/z; right = (-sin θ, cos θ).

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Push a circle out of every box it overlaps. Returns the summed push (0,0 if clear). */
export function resolveCircle(x: number, z: number, r: number, boxes: Box2[]): { x: number; z: number; nx: number; nz: number; hit: boolean } {
  let px = x;
  let pz = z;
  let nx = 0;
  let nz = 0;
  let hit = false;
  for (const b of boxes) {
    if (px < b.minX - r || px > b.maxX + r || pz < b.minZ - r || pz > b.maxZ + r) continue;
    const cx = Math.max(b.minX, Math.min(px, b.maxX));
    const cz = Math.max(b.minZ, Math.min(pz, b.maxZ));
    let dx = px - cx;
    let dz = pz - cz;
    let d = Math.hypot(dx, dz);
    if (d >= r) continue;
    if (d < 1e-6) {
      // Centre inside the box: leave by the nearest face.
      const opts = [
        [px - b.minX, -1, 0],
        [b.maxX - px, 1, 0],
        [pz - b.minZ, 0, -1],
        [b.maxZ - pz, 0, 1],
      ] as const;
      const [depth, ox, oz] = opts.reduce((a, c) => (c[0] < a[0] ? c : a));
      dx = ox;
      dz = oz;
      d = 0;
      px += ox * (depth + r);
      pz += oz * (depth + r);
    } else {
      const push = r - d;
      dx /= d;
      dz /= d;
      px += dx * push;
      pz += dz * push;
    }
    nx += dx;
    nz += dz;
    hit = true;
  }
  const n = Math.hypot(nx, nz) || 1;
  return { x: px, z: pz, nx: nx / n, nz: nz / n, hit };
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ------------------------------------------------------------------ walker
export interface Walker {
  x: number;
  z: number;
  y: number;
  vy: number;
  onGround: boolean;
  /** Body facing (heading convention). */
  facing: number;
  /** Current ground speed, m/s. */
  speed: number;
}
export interface WalkInput {
  forward: number;
  strafe: number;
  /** Camera heading: input is relative to where the camera looks. */
  camYaw: number;
  sprint: boolean;
  jump: boolean;
}

export const WALK = { walk: 4.2, sprint: 7.6, accel: 16, gravity: 24, jump: 7.4, radius: 0.42, turn: 12 };

export function stepWalker(w: Walker, inp: WalkInput, dt: number, solids: Box2[], bounds: Bounds): Walker {
  const s = { ...w };
  const fx = Math.cos(inp.camYaw);
  const fz = Math.sin(inp.camYaw);
  let mx = fx * inp.forward - fz * inp.strafe;
  let mz = fz * inp.forward + fx * inp.strafe;
  const mag = Math.hypot(mx, mz);
  if (mag > 1) {
    mx /= mag;
    mz /= mag;
  }
  const target = Math.min(1, mag) * (inp.sprint ? WALK.sprint : WALK.walk);
  s.speed += clamp(target - s.speed, -WALK.accel * dt, WALK.accel * dt);
  if (mag > 0.05) {
    const want = Math.atan2(mz, mx);
    let d = want - s.facing;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    s.facing += clamp(d, -WALK.turn * dt, WALK.turn * dt);
  }
  // Move along the body's facing (so turning reads naturally), sub-stepped.
  const steps = Math.max(1, Math.ceil((s.speed * dt) / 0.25));
  for (let k = 0; k < steps; k++) {
    let nx = s.x + Math.cos(s.facing) * s.speed * (dt / steps);
    let nz = s.z + Math.sin(s.facing) * s.speed * (dt / steps);
    const r = resolveCircle(nx, nz, WALK.radius, solids);
    nx = clamp(r.x, bounds.minX, bounds.maxX);
    nz = clamp(r.z, bounds.minZ, bounds.maxZ);
    s.x = nx;
    s.z = nz;
  }
  if (inp.jump && s.onGround) {
    s.vy = WALK.jump;
    s.onGround = false;
  }
  s.vy -= WALK.gravity * dt;
  s.y += s.vy * dt;
  if (s.y <= 0) {
    s.y = 0;
    s.vy = 0;
    s.onGround = true;
  }
  return s;
}

// ------------------------------------------------------------------ car
export interface Car {
  x: number;
  z: number;
  heading: number;
  vx: number;
  vz: number;
  /** Smoothed steering, -1..1. */
  steer: number;
}
export interface DriveInput {
  throttle: number; // -1 brake/reverse .. 1 accelerate
  steer: number; // -1 left .. 1 right
  handbrake: boolean;
}

export const CAR = { maxForward: 38, maxReverse: 9, engine: 12, brake: 26, coast: 1.8, wheelbase: 2.6, maxSteer: 0.6, grip: 9, driftGrip: 1.4, radius: 1.05, axle: 1.25 };

/** Signed speed along the car's heading, m/s. */
export function forwardSpeed(c: Car): number {
  return c.vx * Math.cos(c.heading) + c.vz * Math.sin(c.heading);
}

export function stepCar(car: Car, inp: DriveInput, dt: number, solids: Box2[], bounds: Bounds): { car: Car; impact: number } {
  const c = { ...car };
  let fx = Math.cos(c.heading);
  let fz = Math.sin(c.heading);
  let vf = c.vx * fx + c.vz * fz;
  const vl = c.vx * -fz + c.vz * fx;

  if (inp.throttle > 0) vf += CAR.engine * inp.throttle * dt * Math.max(0, 1 - vf / CAR.maxForward);
  else if (inp.throttle < 0) {
    if (vf > 0.5) vf = Math.max(0, vf + CAR.brake * inp.throttle * dt);
    else vf = Math.max(-CAR.maxReverse, vf + CAR.engine * 0.6 * inp.throttle * dt);
  } else vf -= Math.sign(vf) * Math.min(Math.abs(vf), CAR.coast * dt);
  if (inp.handbrake) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 7 * dt);

  // Engine and brakes act along the old heading...
  c.vx = fx * vf - fz * vl;
  c.vz = fz * vf + fx * vl;

  c.steer += (clamp(inp.steer, -1, 1) - c.steer) * Math.min(1, 9 * dt);
  const angle = c.steer * CAR.maxSteer * (1 - Math.min(0.62, Math.abs(vf) / 55));
  c.heading += (vf / CAR.wheelbase) * Math.tan(angle) * dt;

  // ...then the body turns while the velocity keeps its world direction: the
  // sideways part is what tyre grip removes. Less grip (handbrake) = a drift.
  fx = Math.cos(c.heading);
  fz = Math.sin(c.heading);
  const nf = c.vx * fx + c.vz * fz;
  const nl = (c.vx * -fz + c.vz * fx) * Math.exp(-(inp.handbrake ? CAR.driftGrip : CAR.grip) * dt);
  c.vx = fx * nf - fz * nl;
  c.vz = fz * nf + fx * nl;

  // Move, sub-stepped; two circles (front and rear axle) against the world.
  let impact = 0;
  const speed = Math.hypot(c.vx, c.vz);
  const steps = Math.max(1, Math.ceil((speed * dt) / 0.4));
  for (let k = 0; k < steps; k++) {
    c.x += c.vx * (dt / steps);
    c.z += c.vz * (dt / steps);
    for (const side of [1, -1]) {
      const ax = c.x + fx * CAR.axle * side;
      const az = c.z + fz * CAR.axle * side;
      const r = resolveCircle(ax, az, CAR.radius, solids);
      if (r.hit) {
        c.x += r.x - ax;
        c.z += r.z - az;
        const into = c.vx * r.nx + c.vz * r.nz;
        if (into < 0) {
          impact = Math.max(impact, -into);
          c.vx -= r.nx * into * 1.35; // a little bounce
          c.vz -= r.nz * into * 1.35;
          c.vx *= 0.7;
          c.vz *= 0.7;
        }
      }
    }
    const bx = clamp(c.x, bounds.minX + 1, bounds.maxX - 1);
    const bz = clamp(c.z, bounds.minZ + 1, bounds.maxZ - 1);
    if (bx !== c.x) {
      impact = Math.max(impact, Math.abs(c.vx));
      c.vx *= -0.3;
    }
    if (bz !== c.z) {
      impact = Math.max(impact, Math.abs(c.vz));
      c.vz *= -0.3;
    }
    c.x = bx;
    c.z = bz;
  }
  return { car: c, impact };
}
