// Pure footstep/landing cadence, shared by the games. Feed it each frame's
// horizontal distance and ground state; it says when a step or a landing sounds.

export interface StepState {
  /** Distance walked since the last step. */
  acc: number;
  grounded: boolean;
  /** Seconds since leaving the ground. */
  air: number;
}

export interface StepEvents {
  step: boolean;
  jumped: boolean;
  /** 0 = no landing; otherwise impact strength 0.2–1 from time in the air. */
  landed: number;
}

export const newStepState = (): StepState => ({ acc: 0, grounded: true, air: 0 });

/** Minimum airtime that counts as a landing (filters stair bumps and tiny hops). */
export const MIN_AIR = 0.22;

export function advanceSteps(s: StepState, moved: number, grounded: boolean, rising: boolean, dt: number, stride: number): StepEvents {
  const ev: StepEvents = { step: false, jumped: false, landed: 0 };
  if (grounded) {
    if (!s.grounded && s.air >= MIN_AIR) {
      ev.landed = Math.max(0.2, Math.min(1, s.air / 1.2));
      s.acc = 0; // the landing is the footstep
    }
    s.air = 0;
    s.acc += moved;
    if (s.acc >= stride) {
      s.acc -= stride;
      ev.step = true;
    }
    if (moved < 1e-4) s.acc = Math.min(s.acc, stride * 0.5); // standing still: next step comes sooner
  } else {
    if (s.grounded && rising) ev.jumped = true;
    s.air += dt;
  }
  s.grounded = grounded;
  return ev;
}
