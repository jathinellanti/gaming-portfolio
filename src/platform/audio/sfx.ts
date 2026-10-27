import { getAudio, noiseBuffers, type AudioEngine } from "./engine";
import { useSettings } from "../settings";

// One-shot sound effects, synthesised from filtered noise and short tones.
// Every call varies pitch and level slightly, so repeats don't sound mechanical.
// While muted, one-shots aren't built at all (loops keep running, silently).

/** The engine, or null when muted or unavailable. */
function live(): AudioEngine | null {
  return useSettings.getState().sound ? getAudio() : null;
}

export type Sfx = "break" | "place" | "click" | "toast" | "open" | "close" | "jump" | "portal" | "door" | "crash" | "passed";
export type Surface = "grass" | "dirt" | "stone" | "wood" | "sand" | "gravel" | "cloth" | "glass" | "water" | "wet" | "metal";

const rand = (a: number, b: number) => a + Math.random() * (b - a);

interface BurstOpts {
  at?: number;
  dur: number;
  type: BiquadFilterType;
  freq: number;
  q?: number;
  gain: number;
  color?: "white" | "pink" | "brown";
  rate?: number;
  pan?: number;
  attack?: number;
  reverb?: number;
}

/** A filtered noise burst with a fast attack and exponential decay. */
function burst(e: AudioEngine, o: BurstOpts) {
  const { ctx } = e;
  const t = o.at ?? ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffers(ctx)[o.color ?? "white"];
  src.playbackRate.value = o.rate ?? 1;
  const f = ctx.createBiquadFilter();
  f.type = o.type;
  f.frequency.value = o.freq;
  f.Q.value = o.q ?? 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack ?? 0.004));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  const pan = ctx.createStereoPanner();
  pan.pan.value = o.pan ?? 0;
  src.connect(f).connect(g).connect(pan).connect(e.sfx);
  if (o.reverb) {
    const send = ctx.createGain();
    send.gain.value = o.reverb;
    pan.connect(send).connect(e.reverb);
  }
  // Random offset into the 2 s noise buffer, leaving room for the whole burst.
  src.start(t, Math.random() * Math.max(0, 1.9 - o.dur), o.dur + 0.05);
}

interface ToneOpts {
  at?: number;
  freq: number;
  to?: number;
  dur: number;
  type?: OscillatorType;
  gain: number;
  attack?: number;
  reverb?: number;
}

/** A short pitched blip, optionally gliding to `to`. */
function tone(e: AudioEngine, o: ToneOpts) {
  const { ctx } = e;
  const t = o.at ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g).connect(e.sfx);
  if (o.reverb) {
    const send = ctx.createGain();
    send.gain.value = o.reverb;
    g.connect(send).connect(e.reverb);
  }
  osc.start(t);
  osc.stop(t + o.dur + 0.05);
}

export function sfx(kind: Sfx) {
  const e = live();
  if (!e) return;
  switch (kind) {
    case "break":
      burst(e, { dur: 0.16, type: "lowpass", freq: rand(1500, 2200), gain: 0.5, rate: rand(0.8, 1.1) });
      burst(e, { dur: 0.09, type: "bandpass", freq: rand(300, 450), q: 2, gain: 0.35, color: "brown" });
      break;
    case "place":
      burst(e, { dur: 0.08, type: "lowpass", freq: 900, gain: 0.45, color: "brown" });
      tone(e, { freq: rand(95, 120), to: 70, dur: 0.1, gain: 0.25 });
      break;
    case "click":
      tone(e, { freq: rand(1700, 1900), dur: 0.035, type: "square", gain: 0.035 });
      break;
    case "open":
      tone(e, { freq: 520, to: 780, dur: 0.09, type: "triangle", gain: 0.07 });
      burst(e, { dur: 0.06, type: "highpass", freq: 3500, gain: 0.05 });
      break;
    case "close":
      tone(e, { freq: 700, to: 430, dur: 0.09, type: "triangle", gain: 0.06 });
      break;
    case "toast":
      tone(e, { freq: 784, dur: 0.14, type: "triangle", gain: 0.12, reverb: 0.3 });
      tone(e, { at: e.ctx.currentTime + 0.1, freq: 1175, dur: 0.24, type: "triangle", gain: 0.1, reverb: 0.4 });
      break;
    case "jump":
      burst(e, { dur: 0.12, type: "bandpass", freq: rand(700, 900), q: 1.2, gain: 0.12, color: "pink", attack: 0.02 });
      break;
    case "door":
      burst(e, { dur: 0.09, type: "lowpass", freq: 700, gain: 0.5, color: "brown" });
      tone(e, { freq: 140, to: 90, dur: 0.12, gain: 0.18 });
      burst(e, { at: e.ctx.currentTime + 0.05, dur: 0.05, type: "bandpass", freq: 2400, q: 3, gain: 0.08 });
      break;
    case "crash":
      burst(e, { dur: 0.35, type: "lowpass", freq: 900, gain: 0.7, color: "brown" });
      burst(e, { dur: 0.25, type: "bandpass", freq: rand(1800, 2600), q: 0.8, gain: 0.3 });
      for (let i = 0; i < 4; i++) burst(e, { at: e.ctx.currentTime + 0.04 + i * 0.035, dur: 0.06, type: "highpass", freq: 4500, gain: 0.08 });
      break;
    case "passed": {
      const t = e.ctx.currentTime;
      [523, 659, 784, 1047].forEach((f, i) => tone(e, { at: t + i * 0.11, freq: f, dur: 0.5, type: "triangle", gain: 0.11, reverb: 0.5 }));
      tone(e, { at: t + 0.44, freq: 131, dur: 0.9, type: "sawtooth", gain: 0.05, reverb: 0.4 });
      break;
    }
    case "portal":
      tone(e, { freq: 180, to: 720, dur: 1.4, type: "sawtooth", gain: 0.05, attack: 0.3, reverb: 0.8 });
      burst(e, { dur: 1.6, type: "bandpass", freq: 1200, q: 4, gain: 0.08, color: "pink", attack: 0.4, reverb: 0.8 });
      break;
  }
}

/** One footstep on a surface; `weight` 0–1 scales loudness (sneaking → sprinting). */
export function footstep(surface: Surface, weight = 0.6) {
  const e = live();
  if (!e) return;
  const w = 0.5 + 0.5 * Math.max(0, Math.min(1, weight));
  const pan = rand(-0.15, 0.15);
  const rate = rand(0.85, 1.15);
  switch (surface) {
    case "grass":
      burst(e, { dur: 0.11, type: "lowpass", freq: rand(1100, 1500), gain: 0.22 * w, color: "pink", rate, pan });
      burst(e, { dur: 0.07, type: "highpass", freq: 4500, gain: 0.05 * w, rate, pan });
      break;
    case "dirt":
      burst(e, { dur: 0.1, type: "lowpass", freq: rand(700, 950), gain: 0.28 * w, color: "brown", rate, pan });
      break;
    case "stone":
      burst(e, { dur: 0.06, type: "bandpass", freq: rand(1800, 2400), q: 1.5, gain: 0.2 * w, rate, pan });
      burst(e, { dur: 0.08, type: "lowpass", freq: 400, gain: 0.22 * w, color: "brown", pan });
      break;
    case "wood":
      burst(e, { dur: 0.09, type: "bandpass", freq: rand(520, 680), q: 5, gain: 0.32 * w, rate, pan });
      tone(e, { freq: rand(150, 190), to: 120, dur: 0.07, gain: 0.08 * w });
      break;
    case "sand":
      burst(e, { dur: 0.14, type: "highpass", freq: rand(2500, 3500), gain: 0.1 * w, rate, pan, attack: 0.02 });
      burst(e, { dur: 0.1, type: "lowpass", freq: 900, gain: 0.12 * w, color: "pink", pan });
      break;
    case "gravel":
      for (let i = 0; i < 3; i++) burst(e, { at: e.ctx.currentTime + i * 0.018, dur: 0.05, type: "bandpass", freq: rand(1800, 3200), q: 2, gain: 0.14 * w, pan });
      break;
    case "cloth":
      burst(e, { dur: 0.12, type: "lowpass", freq: 600, gain: 0.16 * w, color: "pink", pan, attack: 0.02 });
      break;
    case "glass":
      burst(e, { dur: 0.05, type: "highpass", freq: 3000, gain: 0.1 * w, pan });
      tone(e, { freq: rand(2400, 2900), dur: 0.08, type: "triangle", gain: 0.03 * w });
      break;
    case "water":
      burst(e, { dur: 0.22, type: "bandpass", freq: rand(800, 1200), q: 1.5, gain: 0.2 * w, color: "pink", pan, attack: 0.03 });
      break;
    case "wet":
      // Rain-soaked pavement: a hard heel plus a short splash.
      burst(e, { dur: 0.05, type: "bandpass", freq: rand(1300, 1700), q: 1.8, gain: 0.16 * w, rate, pan });
      burst(e, { dur: 0.13, type: "highpass", freq: rand(3500, 5000), gain: 0.07 * w, pan, attack: 0.01 });
      break;
    case "metal":
      burst(e, { dur: 0.06, type: "bandpass", freq: rand(2600, 3200), q: 6, gain: 0.14 * w, pan });
      tone(e, { freq: rand(880, 1050), dur: 0.12, type: "triangle", gain: 0.025 * w, reverb: 0.2 });
      break;
  }
}

/** Landing after a fall; `impact` 0–1 from fall speed. */
export function land(surface: Surface, impact: number) {
  const e = live();
  if (!e) return;
  const k = Math.max(0.2, Math.min(1, impact));
  burst(e, { dur: 0.12 + 0.1 * k, type: "lowpass", freq: 300 + 300 * k, gain: 0.35 * k, color: "brown" });
  footstep(surface, k);
}
