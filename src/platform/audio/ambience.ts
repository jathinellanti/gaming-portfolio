import { getAudio } from "./engine";
import { createScene, rand, type Scene } from "./scene";

// Looping, generated ambience for each world. Original sound design in the spirit
// of each genre; no recordings or game audio are used.

export type AmbienceKind = "block" | "neon" | "city";

export interface AmbienceHandle {
  /** 0 = night … 1 = noon. Block World crossfades birds and crickets with it. */
  setDaylight(daylight: number): void;
  stop(): void;
}

const SILENT: AmbienceHandle = { setDaylight() {}, stop() {} };

export function startAmbience(kind: AmbienceKind): AmbienceHandle {
  const e = getAudio();
  if (!e) return SILENT;
  const scene = createScene(e, e.ambience);
  return kind === "block" ? blockAmbience(scene) : kind === "neon" ? neonAmbience(scene) : cityAmbience(scene);
}

/** A short pitched chirp with a frequency glide, for birds and crickets. */
function chirp(s: Scene, at: number, from: number, to: number, dur: number, gain: number, pan: number, reverb = 0.25) {
  if (!(gain > 0)) return; // exponential ramps can't reach 0
  const { ctx } = s;
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(from, at);
  o.frequency.exponentialRampToValueAtTime(to, at + dur * 0.8);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  o.connect(g).connect(p).connect(s.out);
  const send = ctx.createGain();
  send.gain.value = reverb;
  p.connect(send).connect(s.e.reverb);
  o.start(at);
  o.stop(at + dur + 0.02);
}

/** A tiny filtered click: one raindrop. */
function drop(s: Scene, at: number) {
  const { ctx } = s;
  const o = ctx.createOscillator();
  o.type = "sine";
  const f = rand(1800, 5200);
  o.frequency.setValueAtTime(f, at);
  o.frequency.exponentialRampToValueAtTime(f * 0.6, at + 0.03);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(rand(0.004, 0.014), at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
  const p = ctx.createStereoPanner();
  p.pan.value = rand(-0.9, 0.9);
  o.connect(g).connect(p).connect(s.out);
  o.start(at);
  o.stop(at + 0.05);
}

function blockAmbience(s: Scene): AmbienceHandle {
  const { ctx, out } = s;
  let day = 1;

  // Wind: brown noise through a wandering band-pass, with slow gusts.
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = "bandpass";
  windFilter.frequency.value = 380;
  windFilter.Q.value = 0.6;
  const wind = ctx.createGain();
  wind.gain.value = 0.16;
  s.loopNoise("brown").connect(windFilter).connect(wind).connect(out);
  const gust = ctx.createGain();
  gust.gain.value = 0.07;
  s.osc("sine", 0.045).connect(gust).connect(wind.gain);
  const sweep = ctx.createGain();
  sweep.gain.value = 180;
  s.osc("sine", 0.031).connect(sweep).connect(windFilter.frequency);

  // Leaves: a high rustle that swells with each gust.
  const leafFilter = ctx.createBiquadFilter();
  leafFilter.type = "highpass";
  leafFilter.frequency.value = 2800;
  const leaves = ctx.createGain();
  leaves.gain.value = 0.0001;
  s.loopNoise("pink").connect(leafFilter).connect(leaves).connect(out);
  s.every(2600, () => {
    const t = ctx.currentTime;
    leaves.gain.setTargetAtTime(rand(0.015, 0.05) * (0.4 + 0.6 * day), t, 0.7);
    leaves.gain.setTargetAtTime(0.004, t + rand(1.2, 2.2), 1.1);
  });

  // Birds by day: short phrases of two to five chirps from somewhere around you.
  s.every(1300, () => {
    if (Math.random() >= 0.32 * day) return;
    const t = ctx.currentTime + 0.05;
    const pan = rand(-0.85, 0.85);
    const base = rand(2300, 3600);
    const n = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const f = base * rand(0.92, 1.12);
      chirp(s, t + i * rand(0.1, 0.17), f, f * rand(1.15, 1.6), rand(0.06, 0.1), 0.045 * day, pan);
    }
  });

  // Crickets by night: trains of three fast pulses.
  s.every(700, () => {
    if (Math.random() >= 0.85 * (1 - day)) return;
    const t = ctx.currentTime + 0.05;
    const pan = rand(-0.9, 0.9);
    const f = rand(4300, 4900);
    for (let i = 0; i < 3; i++) chirp(s, t + i * 0.045, f, f * 0.98, 0.028, 0.014 * (1 - day), pan, 0.1);
  });

  return {
    setDaylight(d) {
      day = Math.max(0, Math.min(1, d));
    },
    stop: s.stop,
  };
}

function neonAmbience(s: Scene): AmbienceHandle {
  const { ctx, out } = s;

  // Rain: a body of pink noise plus a high hiss, and individual drops on surfaces.
  const rainLow = ctx.createBiquadFilter();
  rainLow.type = "highpass";
  rainLow.frequency.value = 450;
  const rainHigh = ctx.createBiquadFilter();
  rainHigh.type = "lowpass";
  rainHigh.frequency.value = 6500;
  const rain = ctx.createGain();
  rain.gain.value = 0.26;
  s.loopNoise("pink").connect(rainLow).connect(rainHigh).connect(rain).connect(out);
  const hissFilter = ctx.createBiquadFilter();
  hissFilter.type = "bandpass";
  hissFilter.frequency.value = 3200;
  hissFilter.Q.value = 0.5;
  const hiss = ctx.createGain();
  hiss.gain.value = 0.05;
  s.loopNoise("white").connect(hissFilter).connect(hiss).connect(out);
  s.every(90, () => {
    const t = ctx.currentTime + 0.02;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) drop(s, t + Math.random() * 0.09);
  });

  // City: a low detuned drone and the faint buzz of neon transformers.
  const humFilter = ctx.createBiquadFilter();
  humFilter.type = "lowpass";
  humFilter.frequency.value = 150;
  const hum = ctx.createGain();
  hum.gain.value = 0.045;
  humFilter.connect(hum).connect(out);
  s.osc("sawtooth", 55).connect(humFilter);
  s.osc("sawtooth", 55.6).connect(humFilter);
  const buzzFilter = ctx.createBiquadFilter();
  buzzFilter.type = "bandpass";
  buzzFilter.frequency.value = 240;
  buzzFilter.Q.value = 8;
  const buzz = ctx.createGain();
  buzz.gain.value = 0.007;
  s.osc("square", 120).connect(buzzFilter).connect(buzz).connect(out);

  // Traffic: cars swelling past from one side to the other.
  const carFilter = ctx.createBiquadFilter();
  carFilter.type = "lowpass";
  carFilter.frequency.value = 340;
  const car = ctx.createGain();
  car.gain.value = 0.0001;
  const carPan = ctx.createStereoPanner();
  s.loopNoise("brown").connect(carFilter).connect(car).connect(carPan).connect(out);
  s.every(4200, () => {
    if (Math.random() > 0.7) return;
    const t = ctx.currentTime;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const len = rand(2.5, 4);
    carPan.pan.cancelScheduledValues(t);
    carPan.pan.setValueAtTime(-0.85 * dir, t);
    carPan.pan.linearRampToValueAtTime(0.85 * dir, t + len);
    car.gain.cancelScheduledValues(t);
    car.gain.setValueAtTime(Math.max(car.gain.value, 0.0001), t);
    car.gain.exponentialRampToValueAtTime(rand(0.09, 0.18), t + len * 0.45);
    car.gain.exponentialRampToValueAtTime(0.0001, t + len);
  });

  // Now and then: a distant siren, or a flying car whooshing overhead.
  s.every(9000, () => {
    const t = ctx.currentTime + 0.1;
    if (Math.random() < 0.35) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(600, t);
      for (let i = 0; i < 3; i++) {
        o.frequency.linearRampToValueAtTime(940, t + i * 1.3 + 0.65);
        o.frequency.linearRampToValueAtTime(600, t + i * 1.3 + 1.3);
      }
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1600;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.012, t + 1);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.9);
      const p = ctx.createStereoPanner();
      p.pan.value = rand(-0.8, 0.8);
      o.connect(lp).connect(g).connect(p).connect(out);
      const send = ctx.createGain();
      send.gain.value = 0.7;
      p.connect(send).connect(s.e.reverb);
      o.start(t);
      o.stop(t + 4);
    } else if (Math.random() < 0.5) {
      const whoosh = s.loopNoise("pink");
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(380, t);
      bp.frequency.exponentialRampToValueAtTime(1500, t + 1.2);
      bp.frequency.exponentialRampToValueAtTime(420, t + 2.6);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 1.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      const p = ctx.createStereoPanner();
      p.pan.setValueAtTime(-0.9, t);
      p.pan.linearRampToValueAtTime(0.9, t + 2.6);
      whoosh.connect(bp).connect(g).connect(p).connect(out);
      whoosh.stop(t + 2.7);
    }
  });

  return { setDaylight() {}, stop: s.stop };
}

function cityAmbience(s: Scene): AmbienceHandle {
  const { ctx, out } = s;

  // Surf: brown noise swelling and breaking on a slow cycle.
  const surfFilter = ctx.createBiquadFilter();
  surfFilter.type = "lowpass";
  surfFilter.frequency.value = 700;
  const surf = ctx.createGain();
  surf.gain.value = 0.04;
  s.loopNoise("brown").connect(surfFilter).connect(surf).connect(out);
  const swell = ctx.createGain();
  swell.gain.value = 0.09;
  s.osc("sine", 0.11).connect(swell).connect(surf.gain);
  const foamFilter = ctx.createBiquadFilter();
  foamFilter.type = "highpass";
  foamFilter.frequency.value = 2500;
  const foam = ctx.createGain();
  foam.gain.value = 0.012;
  s.loopNoise("pink").connect(foamFilter).connect(foam).connect(out);
  const foamSwell = ctx.createGain();
  foamSwell.gain.value = 0.02;
  s.osc("sine", 0.11).connect(foamSwell).connect(foam.gain);

  // A warm city bed: soft low drone of distant traffic.
  const bedFilter = ctx.createBiquadFilter();
  bedFilter.type = "lowpass";
  bedFilter.frequency.value = 260;
  const bed = ctx.createGain();
  bed.gain.value = 0.05;
  s.loopNoise("brown").connect(bedFilter).connect(bed).connect(out);

  // Gulls now and then: two or three falling cries.
  s.every(3200, () => {
    if (Math.random() > 0.4) return;
    const t = ctx.currentTime + 0.05;
    const pan = rand(-0.9, 0.9);
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const f = rand(1500, 2100);
      chirp(s, t + i * rand(0.28, 0.4), f, f * 0.62, rand(0.22, 0.32), 0.035, pan, 0.35);
    }
  });

  // A distant car horn, rarely.
  s.every(11000, () => {
    if (Math.random() > 0.3) return;
    const t = ctx.currentTime + 0.05;
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = rand(330, 420);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.012, t + 0.03);
    g.gain.setValueAtTime(0.012, t + 0.32);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    const p = ctx.createStereoPanner();
    p.pan.value = rand(-0.8, 0.8);
    o.connect(lp).connect(g).connect(p).connect(out);
    o.start(t);
    o.stop(t + 0.45);
  });

  return { setDaylight() {}, stop: s.stop };
}
