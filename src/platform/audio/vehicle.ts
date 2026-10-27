import { getAudio } from "./engine";

// A car engine voice: two detuned oscillators an octave apart through a low-pass
// that opens with throttle. `set` is called every frame with speed and throttle.

export interface EngineHandle {
  /** speed01: 0 idle .. 1 top speed; throttle: 0..1. */
  set(speed01: number, throttle: number): void;
  stop(): void;
}

export function startEngine(): EngineHandle {
  const e = getAudio();
  if (!e) return { set() {}, stop() {} };
  const { ctx } = e;
  const a = ctx.createOscillator();
  a.type = "sawtooth";
  const b = ctx.createOscillator();
  b.type = "square";
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 3;
  const g = ctx.createGain();
  g.gain.value = 0.0001;
  const mixB = ctx.createGain();
  mixB.gain.value = 0.5;
  a.connect(lp);
  b.connect(mixB).connect(lp);
  lp.connect(g).connect(e.sfx);
  a.start();
  b.start();
  g.gain.setTargetAtTime(0.05, ctx.currentTime, 0.15);
  let stopped = false;
  return {
    set(speed01, throttle) {
      if (stopped) return;
      const t = ctx.currentTime;
      const s = Math.max(0, Math.min(1, speed01));
      // A gearbox feel: pitch climbs within each of four gears.
      const gear = Math.min(3, Math.floor(s * 4));
      const inGear = s * 4 - gear;
      const f = 42 + gear * 14 + inGear * 70;
      a.frequency.setTargetAtTime(f, t, 0.05);
      b.frequency.setTargetAtTime(f / 2 + 0.7, t, 0.05);
      lp.frequency.setTargetAtTime(260 + throttle * 1500 + s * 600, t, 0.08);
      g.gain.setTargetAtTime(0.035 + throttle * 0.045 + s * 0.02, t, 0.1);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      const t = ctx.currentTime;
      g.gain.setTargetAtTime(0.0001, t, 0.08);
      a.stop(t + 0.4);
      b.stop(t + 0.4);
    },
  };
}
