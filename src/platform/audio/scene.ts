import { noiseBuffers, type AudioEngine } from "./engine";

// Lifecycle shared by ambience and music: a gain that fades in, timers that
// schedule events, looping sources, and one stop() that fades out, clears the
// timers, and disconnects everything a moment later.

export interface Scene {
  e: AudioEngine;
  ctx: AudioContext;
  out: GainNode;
  every(ms: number, fn: () => void): void;
  loopNoise(color: "white" | "pink" | "brown"): AudioBufferSourceNode;
  osc(type: OscillatorType, freq: number): OscillatorNode;
  stop(): void;
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
export const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export function createScene(e: AudioEngine, bus: GainNode, fadeIn = 1.5): Scene {
  const { ctx } = e;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, ctx.currentTime);
  out.gain.exponentialRampToValueAtTime(1, ctx.currentTime + fadeIn);
  out.connect(bus);
  const timers: number[] = [];
  const sources: AudioScheduledSourceNode[] = [];
  let stopped = false;
  return {
    e,
    ctx,
    out,
    every(ms, fn) {
      timers.push(
        window.setInterval(() => {
          if (!stopped && ctx.state === "running") fn();
        }, ms),
      );
    },
    loopNoise(color) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffers(ctx)[color];
      src.loop = true;
      src.loopStart = Math.random();
      src.start(ctx.currentTime, Math.random() * 1.5);
      sources.push(src);
      return src;
    },
    osc(type, freq) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.start();
      sources.push(o);
      return o;
    },
    stop() {
      if (stopped) return;
      stopped = true;
      timers.forEach((id) => window.clearInterval(id));
      const t = ctx.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      window.setTimeout(() => {
        for (const s of sources) {
          try {
            s.stop();
          } catch {
            /* already stopped */
          }
        }
        out.disconnect();
      }, 800);
    },
  };
}
