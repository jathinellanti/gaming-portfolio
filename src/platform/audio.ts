import { useSettings } from "./settings";
import { raise } from "./faults";

// Tiny synthesised sound effects (no audio files, nothing licensed). Silent unless
// the visitor turns sound on; a blocked AudioContext raises audio.blocked once.
export type Sfx = "break" | "place" | "click" | "toast";

let ctx: AudioContext | null = null;
let blockedRaised = false;

function context(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended")
      ctx.resume().catch(() => {
        if (!blockedRaised) {
          blockedRaised = true;
          raise("audio.blocked");
        }
      });
    return ctx;
  } catch {
    if (!blockedRaised) {
      blockedRaised = true;
      raise("audio.blocked");
    }
    return null;
  }
}

function tone(a: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(a.destination);
  o.start(start);
  o.stop(start + dur);
}

function noise(a: AudioContext, start: number, dur: number, cutoff: number, gain: number) {
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = cutoff;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start(start);
}

export function sfx(kind: Sfx) {
  if (!useSettings.getState().sound) return;
  const a = context();
  if (!a) return;
  const t = a.currentTime;
  if (kind === "break") noise(a, t, 0.12, 1800, 0.35);
  else if (kind === "place") {
    noise(a, t, 0.06, 700, 0.3);
    tone(a, 110, t, 0.08, "sine", 0.15);
  } else if (kind === "click") tone(a, 880, t, 0.05, "square", 0.04);
  else {
    tone(a, 784, t, 0.12, "triangle", 0.12);
    tone(a, 1175, t + 0.1, 0.18, "triangle", 0.1);
  }
}
