import { useSettings, type Settings } from "../settings";
import { raise } from "../faults";

// One AudioContext for the whole app. Three buses feed a master gain:
//   sfx → master, ambience → master, music → master (music also follows
//   settings.music), and a shared generated reverb that any bus can send to.
// Muting ramps gains instead of stopping sources, so loops resume seamlessly.
// Everything is synthesised: there are no audio files and nothing to license.

export interface AudioEngine {
  ctx: AudioContext;
  master: GainNode;
  sfx: GainNode;
  ambience: GainNode;
  music: GainNode;
  /** Send target: connect a gain here to add room/space. */
  reverb: GainNode;
}

const LEVEL = { sfx: 0.9, ambience: 0.75, music: 0.32 };
const RAMP = 0.08; // seconds; time constant for mute/unmute

let engine: AudioEngine | null = null;
let unavailable = false;
let blockedRaised = false;

function audioContextClass(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

/** A stereo impulse of decaying noise: a cheap, decent-sounding room. */
function impulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function applySettings(e: AudioEngine, s: Pick<Settings, "sound" | "music">) {
  const t = e.ctx.currentTime;
  e.master.gain.setTargetAtTime(s.sound ? 1 : 0, t, RAMP);
  e.music.gain.setTargetAtTime(s.music ? LEVEL.music : 0, t, RAMP * 4);
}

function resume(ctx: AudioContext) {
  if (ctx.state !== "suspended" || document.visibilityState === "hidden") return;
  ctx.resume().catch((err: unknown) => {
    if (blockedRaised) return;
    blockedRaised = true;
    raise("audio.blocked", { err: String(err) });
  });
}

function create(): AudioEngine | null {
  const Ctx = audioContextClass();
  try {
    if (!Ctx) throw new Error("Web Audio API not present");
    const ctx = new Ctx();
    const bus = (level: number) => {
      const g = ctx.createGain();
      g.gain.value = level;
      return g;
    };
    const master = bus(0);
    master.connect(ctx.destination);
    const reverbIn = bus(1);
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse(ctx, 2.6, 2.4);
    const reverbOut = bus(0.55);
    reverbIn.connect(convolver).connect(reverbOut).connect(master);
    const e: AudioEngine = { ctx, master, sfx: bus(LEVEL.sfx), ambience: bus(LEVEL.ambience), music: bus(0), reverb: reverbIn };
    e.sfx.connect(master);
    e.ambience.connect(master);
    e.music.connect(master);
    applySettings(e, useSettings.getState());
    useSettings.subscribe((s) => applySettings(e, s));

    // Browsers start a context suspended until the visitor interacts; resume on the first gesture.
    const unlock = () => resume(ctx);
    for (const type of ["pointerdown", "keydown", "touchstart"]) window.addEventListener(type, unlock, { passive: true });
    // Don't burn CPU (or play into a background tab) while hidden.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") ctx.suspend().catch(() => {});
      else resume(ctx);
    });
    resume(ctx);
    return e;
  } catch (err) {
    unavailable = true;
    raise("audio.unsupported", { err: String(err) });
    return null;
  }
}

/** The shared engine, created on first use; null when Web Audio is unavailable. */
export function getAudio(): AudioEngine | null {
  if (engine) {
    resume(engine.ctx);
    return engine;
  }
  if (unavailable) return null;
  engine = create();
  return engine;
}

/** Tests only: forget the engine so the next getAudio() builds a fresh one. */
export function __resetAudio() {
  engine = null;
  unavailable = false;
  blockedRaised = false;
}

let noiseCache: { ctx: AudioContext; white: AudioBuffer; pink: AudioBuffer; brown: AudioBuffer } | null = null;

/** Two seconds of looping white, pink and brown noise, made once per context. */
export function noiseBuffers(ctx: AudioContext) {
  if (noiseCache?.ctx === ctx) return noiseCache;
  const len = ctx.sampleRate * 2;
  const make = (fill: (d: Float32Array) => void) => {
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    fill(b.getChannelData(0));
    return b;
  };
  const white = make((d) => {
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  });
  // Paul Kellet's economy pink filter.
  const pink = make((d) => {
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
    }
  });
  const brown = make((d) => {
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
  });
  noiseCache = { ctx, white, pink, brown };
  return noiseCache;
}
