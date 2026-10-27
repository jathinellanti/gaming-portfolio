import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { __resetAudio, getAudio } from "../../src/platform/audio/engine";
import { advanceSteps, footstep, land, newStepState, sfx, startAmbience, startMusic, type Surface } from "../../src/platform/audio";
import { useSettings, DEFAULT_SETTINGS } from "../../src/platform/settings";
import * as faults from "../../src/platform/faults";
import { surfaceFor } from "../../src/games/block/audio";
import { B } from "../../src/games/block/world/blocks";

// A minimal Web Audio stand-in. Like real browsers, it throws on exponential ramps
// to (or from) zero, so a silent-gain bug fails here instead of in a player's tab.
class Param {
  value: number;
  calls: [string, number][] = [];
  constructor(v = 1) {
    this.value = v;
  }
  setValueAtTime(v: number) {
    this.calls.push(["set", v]);
    this.value = v;
    return this;
  }
  linearRampToValueAtTime(v: number) {
    this.calls.push(["linear", v]);
    return this;
  }
  exponentialRampToValueAtTime(v: number) {
    if (!(v > 0)) throw new RangeError(`exponential ramp to ${v}`);
    this.calls.push(["exp", v]);
    return this;
  }
  setTargetAtTime(v: number) {
    this.calls.push(["target", v]);
    return this;
  }
  cancelScheduledValues() {
    return this;
  }
}

let ctxs: FakeCtx[] = [];

class Node {
  outputs: unknown[] = [];
  disconnected = false;
  connect<T>(n: T): T {
    this.outputs.push(n);
    return n;
  }
  disconnect() {
    this.disconnected = true;
  }
}

class Source extends Node {
  started = 0;
  stopped = 0;
  buffer: unknown = null;
  loop = false;
  loopStart = 0;
  type = "sine";
  frequency = new Param(440);
  detune = new Param(0);
  playbackRate = new Param(1);
  constructor(ctx: FakeCtx) {
    super();
    ctx.sources.push(this);
  }
  start() {
    this.started++;
  }
  stop() {
    if (this.stopped) throw new Error("InvalidStateError: already stopped");
    this.stopped++;
  }
}

class FakeCtx {
  currentTime = 1;
  sampleRate = 800;
  state = "running";
  destination = new Node();
  sources: Source[] = [];
  gains: (Node & { gain: Param })[] = [];
  constructor() {
    ctxs.push(this);
  }
  createGain() {
    const g = Object.assign(new Node(), { gain: new Param(1) });
    this.gains.push(g);
    return g;
  }
  createOscillator() {
    return new Source(this);
  }
  createBufferSource() {
    return new Source(this);
  }
  createBiquadFilter() {
    return Object.assign(new Node(), { type: "lowpass", frequency: new Param(350), Q: new Param(1) });
  }
  createStereoPanner() {
    return Object.assign(new Node(), { pan: new Param(0) });
  }
  createConvolver() {
    return Object.assign(new Node(), { buffer: null });
  }
  createBuffer(channels: number, length: number) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { getChannelData: (c: number) => data[c] };
  }
  resume() {
    this.state = "running";
    return Promise.resolve();
  }
  suspend() {
    this.state = "suspended";
    return Promise.resolve();
  }
}

const SURFACES: Surface[] = ["grass", "dirt", "stone", "wood", "sand", "gravel", "cloth", "glass", "water", "wet", "metal"];

describe("audio engine", () => {
  beforeEach(() => {
    ctxs = [];
    __resetAudio();
    vi.stubGlobal("AudioContext", FakeCtx);
    useSettings.setState({ ...DEFAULT_SETTINGS });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("builds one context with a master bus to the speakers, following the sound and music settings", () => {
    const e = getAudio()!;
    expect(getAudio()).toBe(e);
    expect(ctxs).toHaveLength(1);
    const master = e.master as unknown as Node & { gain: Param };
    expect(master.outputs).toContain(e.ctx.destination);
    expect(master.gain.calls.at(-1)).toEqual(["target", 1]);
    useSettings.getState().set({ sound: false });
    expect(master.gain.calls.at(-1)).toEqual(["target", 0]);
    const music = e.music as unknown as { gain: Param };
    useSettings.getState().set({ sound: true, music: false });
    expect(music.gain.calls.at(-1)).toEqual(["target", 0]);
  });

  it("without Web Audio, raises audio.unsupported once and every call is a silent no-op", () => {
    vi.stubGlobal("AudioContext", undefined);
    const spy = vi.spyOn(faults, "raise");
    expect(getAudio()).toBeNull();
    expect(getAudio()).toBeNull();
    expect(() => {
      sfx("break");
      footstep("grass");
      land("stone", 1);
      startAmbience("neon").stop();
      startMusic("block").stop();
    }).not.toThrow();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("audio.unsupported", expect.anything());
  });

  it("every effect and every footstep surface plays without an invalid ramp", () => {
    for (const k of ["break", "place", "click", "toast", "open", "close", "jump", "portal"] as const) sfx(k);
    for (const s of SURFACES) {
      footstep(s, 0);
      footstep(s, 1);
      land(s, 0);
      land(s, 1);
    }
    const ctx = ctxs[0];
    expect(ctx.sources.length).toBeGreaterThan(50);
    expect(ctx.sources.every((s) => s.started === 1)).toBe(true);
  });

  it("while muted, one-shots aren't built at all", () => {
    useSettings.getState().set({ sound: false });
    sfx("break");
    footstep("stone");
    expect(ctxs[0]?.sources.length ?? 0).toBe(0);
  });

  it("Block ambience schedules birds by day and crickets by night, then stops cleanly", () => {
    vi.useFakeTimers();
    const amb = startAmbience("block");
    const ctx = ctxs[0];
    const freqs = (from: number) => ctx.sources.slice(from).map((s) => s.frequency.calls[0]?.[1] ?? 0);

    amb.setDaylight(1);
    let mark = ctx.sources.length;
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    vi.advanceTimersByTime(1400);
    expect(freqs(mark).some((f) => f >= 2000 && f < 4000)).toBe(true); // birds
    expect(freqs(mark).some((f) => f >= 4200)).toBe(false); // no crickets at noon

    amb.setDaylight(0);
    mark = ctx.sources.length;
    vi.advanceTimersByTime(1400);
    expect(freqs(mark).some((f) => f >= 4200)).toBe(true); // crickets
    expect(freqs(mark).some((f) => f >= 2000 && f < 4000)).toBe(false); // no birds at night

    amb.stop();
    mark = ctx.sources.length;
    vi.advanceTimersByTime(5000);
    expect(ctx.sources.length).toBe(mark); // timers cleared
    expect(ctx.sources.filter((s) => s.loop).every((s) => s.stopped === 1)).toBe(true);
  });

  it("Neon ambience runs rain, city and traffic loops and survives a long session", () => {
    vi.useFakeTimers();
    const amb = startAmbience("neon");
    const ctx = ctxs[0];
    expect(ctx.sources.filter((s) => s.loop).length).toBeGreaterThanOrEqual(3);
    for (const r of [0.01, 0.3, 0.6, 0.99]) {
      vi.spyOn(Math, "random").mockReturnValue(r);
      vi.advanceTimersByTime(20_000);
    }
    expect(() => amb.stop()).not.toThrow();
    vi.advanceTimersByTime(1000);
  });

  it("music schedules notes ahead for both styles and stops", () => {
    vi.useFakeTimers();
    for (const style of ["block", "neon"] as const) {
      __resetAudio();
      const m = startMusic(style);
      const ctx = ctxs.at(-1)!;
      const before = ctx.sources.length;
      ctx.currentTime = 30; // past the opening pause
      vi.advanceTimersByTime(400);
      expect(ctx.sources.length, style).toBeGreaterThan(before);
      m.stop();
      const after = ctx.sources.length;
      ctx.currentTime = 60;
      vi.advanceTimersByTime(2000);
      expect(ctx.sources.length, style).toBe(after);
    }
  });

  it("a stopped scene doesn't schedule while the context is suspended (hidden tab)", () => {
    vi.useFakeTimers();
    startAmbience("neon");
    const ctx = ctxs[0];
    ctx.state = "suspended";
    const mark = ctx.sources.length;
    vi.advanceTimersByTime(5000);
    expect(ctx.sources.length).toBe(mark);
  });
});

describe("footstep cadence", () => {
  it("steps once per stride while grounded; standing still primes a quick first step", () => {
    const s = newStepState();
    const hits = Array.from({ length: 10 }, () => advanceSteps(s, 0.5, true, false, 0.016, 1.6).step).filter(Boolean);
    expect(hits).toHaveLength(3); // 5 m walked / 1.6 m stride
    s.acc = 1.5;
    advanceSteps(s, 0, true, false, 0.016, 1.6);
    expect(s.acc).toBe(0.8);
  });

  it("detects a jump on take-off and a landing scaled by airtime; ignores tiny hops", () => {
    const s = newStepState();
    expect(advanceSteps(s, 0, false, true, 0.016, 1.6).jumped).toBe(true);
    expect(advanceSteps(s, 0, false, true, 0.016, 1.6).jumped).toBe(false);
    for (let i = 0; i < 40; i++) advanceSteps(s, 0, false, false, 0.016, 1.6);
    const landing = advanceSteps(s, 0.1, true, false, 0.016, 1.6);
    expect(landing.landed).toBeGreaterThan(0.2);
    expect(landing.landed).toBeLessThanOrEqual(1);
    expect(landing.step).toBe(false);

    const hop = newStepState();
    advanceSteps(hop, 0, false, false, 0.1, 1.6);
    expect(advanceSteps(hop, 0, true, false, 0.016, 1.6).landed).toBe(0);
  });

  it("falling for a long time lands at full impact, never more", () => {
    const s = newStepState();
    for (let i = 0; i < 300; i++) advanceSteps(s, 0, false, false, 0.016, 1.6);
    expect(advanceSteps(s, 0, true, false, 0.016, 1.6).landed).toBe(1);
  });
});

describe("Block World surfaces", () => {
  it("maps blocks underfoot to footstep sounds, defaulting to stone", () => {
    expect(surfaceFor(B.GRASS)).toBe("grass");
    expect(surfaceFor(B.PLANKS)).toBe("wood");
    expect(surfaceFor(B.SAND)).toBe("sand");
    expect(surfaceFor(B.WATER)).toBe("water");
    expect(surfaceFor(B.STONE_BRICK)).toBe("stone");
    expect(surfaceFor(9999)).toBe("stone");
  });
});
