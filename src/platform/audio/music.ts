import { getAudio } from "./engine";
import { createScene, midiHz, pick, rand, type Scene } from "./scene";

// Generative background music, written in code for this site (no recordings):
//   block — sparse, soft piano-like phrases on a pentatonic scale, long silences.
//   neon  — a slow minor synthwave loop: detuned pad, pulsing bass, a rare arpeggio.
//   city  — laid-back "sunset radio": soft electric-piano chords, a walking bass, brushed hats.
// A lookahead scheduler queues notes ~0.6 s ahead so timing stays tight.

export type MusicStyle = "block" | "neon" | "city";
export interface MusicHandle {
  stop(): void;
}

const LOOKAHEAD = 0.6;

export function startMusic(style: MusicStyle): MusicHandle {
  const e = getAudio();
  if (!e) return { stop() {} };
  const scene = createScene(e, e.music, 4);
  if (style === "block") calm(scene);
  else if (style === "neon") nightDrive(scene);
  else sunsetRadio(scene);
  return { stop: scene.stop };
}

/** A soft, bell-ish piano note: triangle fundamental plus a quiet octave, long decay. */
function pianoNote(s: Scene, at: number, midi: number, vel: number, decay = 3.2) {
  const { ctx } = s;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vel, at + 0.01);
  g.gain.exponentialRampToValueAtTime(vel * 0.35, at + 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(3200, at);
  lp.frequency.exponentialRampToValueAtTime(900, at + decay);
  for (const [mult, level, type] of [
    [1, 1, "triangle"],
    [2, 0.22, "sine"],
    [3, 0.06, "sine"],
  ] as const) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = midiHz(midi) * mult;
    o.detune.value = rand(-4, 4);
    const og = ctx.createGain();
    og.gain.value = level;
    o.connect(og).connect(lp);
    o.start(at);
    o.stop(at + decay + 0.05);
  }
  lp.connect(g).connect(s.out);
  const send = ctx.createGain();
  send.gain.value = 0.6;
  g.connect(send).connect(s.e.reverb);
}

function calm(s: Scene) {
  const SCALE = [60, 62, 64, 67, 69, 72, 74, 76, 79]; // C major pentatonic, two octaves
  const BASS = [36, 43, 45, 41];
  let next = s.ctx.currentTime + 5; // the first phrase arrives after a short quiet
  s.every(200, () => {
    const now = s.ctx.currentTime;
    if (next > now + LOOKAHEAD) return;
    let t = Math.max(next, now + 0.05);
    if (Math.random() < 0.6) pianoNote(s, t, pick(BASS), 0.09, 6);
    let i = Math.floor(Math.random() * SCALE.length);
    const notes = 3 + Math.floor(Math.random() * 5);
    for (let n = 0; n < notes; n++) {
      // A gentle random walk over the scale: mostly steps, sometimes a leap.
      i = Math.max(0, Math.min(SCALE.length - 1, i + pick([-2, -1, -1, 1, 1, 2, 3])));
      pianoNote(s, t, SCALE[i], rand(0.07, 0.12));
      if (Math.random() < 0.18) pianoNote(s, t, SCALE[Math.max(0, i - 2)], 0.05);
      t += pick([0.55, 0.8, 0.8, 1.1, 1.6]);
    }
    next = t + rand(10, 24); // long silences are the point
  });
}

function nightDrive(s: Scene) {
  const { ctx } = s;
  const BEAT = 60 / 84;
  // D minor: i – VI – III – VII (Dm, Bb, F, C), two bars each.
  const CHORDS = [
    [50, 53, 57],
    [46, 50, 53],
    [53, 57, 60],
    [48, 52, 55],
  ];
  const BASS_PATTERN = [1, 0, 1, 1, 0, 1, 1, 0]; // eighth notes per bar
  let bar = 0;
  let next = ctx.currentTime + 1;

  const pad = (at: number, notes: number[], len: number) => {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(500, at);
    lp.frequency.linearRampToValueAtTime(1300, at + len * 0.5);
    lp.frequency.linearRampToValueAtTime(600, at + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.06, at + 1.4);
    g.gain.setValueAtTime(0.06, at + len - 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len + 1.6);
    for (const m of notes)
      for (const cents of [-8, 8]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = midiHz(m + 12);
        o.detune.value = cents;
        o.connect(lp);
        o.start(at);
        o.stop(at + len + 1.7);
      }
    lp.connect(g).connect(s.out);
    const send = ctx.createGain();
    send.gain.value = 0.5;
    g.connect(send).connect(s.e.reverb);
  };

  const bass = (at: number, midi: number) => {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = midiHz(midi - 12);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(420, at);
    lp.frequency.exponentialRampToValueAtTime(140, at + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.13, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + BEAT * 0.48);
    o.connect(lp).connect(g).connect(s.out);
    o.start(at);
    o.stop(at + BEAT * 0.5);
  };

  const arp = (at: number, notes: number[]) => {
    for (let i = 0; i < 8; i++) {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = midiHz(notes[i % notes.length] + 24);
      const g = ctx.createGain();
      const t = at + i * (BEAT / 2);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.03, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + BEAT * 0.45);
      o.connect(g).connect(s.out);
      const send = ctx.createGain();
      send.gain.value = 0.6;
      g.connect(send).connect(s.e.reverb);
      o.start(t);
      o.stop(t + BEAT * 0.5);
    }
  };

  s.every(200, () => {
    const now = ctx.currentTime;
    while (next < now + LOOKAHEAD) {
      const t = Math.max(next, now + 0.02);
      const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
      if (bar % 2 === 0) pad(t, chord, BEAT * 8);
      BASS_PATTERN.forEach((on, i) => on && bass(t + i * (BEAT / 2), chord[0]));
      if (bar % 4 === 3 && Math.random() < 0.5) arp(t, chord);
      bar++;
      next = t + BEAT * 4;
    }
  });
}

function sunsetRadio(s: Scene) {
  const { ctx } = s;
  const BEAT = 60 / 92;
  // A minor ii–V–I–vi colour: Am7, Dm7, G7, Cmaj7 (one bar each).
  const CHORDS = [
    [57, 60, 64, 67],
    [50, 53, 57, 60],
    [55, 59, 62, 65],
    [48, 52, 55, 59],
  ];
  let bar = 0;
  let next = ctx.currentTime + 1.5;

  const keys = (at: number, notes: number[]) => {
    for (const m of notes) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = midiHz(m + 12);
      const o2 = ctx.createOscillator();
      o2.type = "triangle";
      o2.frequency.value = midiHz(m + 24);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.035, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.012, at + BEAT * 1.5);
      g.gain.exponentialRampToValueAtTime(0.0001, at + BEAT * 3.6);
      const g2 = ctx.createGain();
      g2.gain.value = 0.25;
      o.connect(g);
      o2.connect(g2).connect(g);
      g.connect(s.out);
      const send = ctx.createGain();
      send.gain.value = 0.45;
      g.connect(send).connect(s.e.reverb);
      for (const osc of [o, o2]) {
        osc.start(at);
        osc.stop(at + BEAT * 3.7);
      }
    }
  };
  const bassNote = (at: number, midi: number) => {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = midiHz(midi - 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.12, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + BEAT * 0.9);
    o.connect(g).connect(s.out);
    o.start(at);
    o.stop(at + BEAT);
  };
  const hat = (at: number, accent: boolean) => {
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = 8000 + Math.random() * 900;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(accent ? 0.006 : 0.0035, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    o.connect(hp).connect(g).connect(s.out);
    o.start(at);
    o.stop(at + 0.06);
  };

  s.every(200, () => {
    const now = ctx.currentTime;
    while (next < now + 0.6) {
      const t = Math.max(next, now + 0.02);
      const chord = CHORDS[bar % CHORDS.length];
      keys(t, chord);
      keys(t + BEAT * 2.5, chord.slice(1));
      // Walking bass: root, fifth, octave, approach.
      [chord[0], chord[0] + 7, chord[0] + 12, chord[0] + (bar % 2 ? 10 : 5)].forEach((m, i) => bassNote(t + i * BEAT, m));
      for (let i = 0; i < 8; i++) hat(t + i * (BEAT / 2) + (i % 2 ? BEAT * 0.08 : 0), i % 4 === 2);
      bar++;
      next = t + BEAT * 4;
    }
  });
}
