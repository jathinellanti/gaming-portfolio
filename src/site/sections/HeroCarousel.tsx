import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Pause, Play } from "lucide-react";
import { prefersReducedMotion } from "../../platform/webgl";

// Full-bleed background carousel for the hero: original anime-style key art for
// each game world (generated, no third-party game assets), cross-fading with a slow
// Ken Burns drift. Pausable (WCAG 2.2.2); starts paused under reduced motion.

export interface Slide {
  id: "block" | "city" | "neon";
  name: string;
  tag: string;
  file: string;
  alt: string;
  /** Focal point so the art crops well on narrow screens. */
  focus: string;
}

export const SLIDES: Slide[] = [
  { id: "block", name: "Block World", tag: "Voxel survival-craft", file: "block-world", alt: "Illustrated voxel valley at sunrise: cube terraces, a waterfall and a lantern-lit village", focus: "60% 50%" },
  { id: "city", name: "Open City", tag: "Sunset coastal sandbox", file: "open-city", alt: "Illustrated coastal city at golden hour: palm-lined boulevard, art-deco buildings and a red sports car", focus: "62% 50%" },
  { id: "neon", name: "Neon City", tag: "Rain-soaked megacity", file: "neon-city", alt: "Illustrated neon megacity at night in the rain, with holographic billboards and flying cars", focus: "64% 50%" },
];

const SLIDE_MS = 7000;
const srcSet = (f: string) => `/hero/${f}-960.webp 960w, /hero/${f}-1600.webp 1600w, /hero/${f}-2400.webp 2400w`;

export function useCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(() => prefersReducedMotion());
  const [hoverPause, setHoverPause] = useState(false);
  const [cycle, setCycle] = useState(0); // restarts the progress bar
  const running = !paused && !hoverPause;
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
      setCycle((c) => c + 1);
    }, SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [running, index, cycle]);
  const go = (i: number) => {
    setIndex(i);
    setCycle((c) => c + 1);
  };
  return { index, go, paused, setPaused, running, setHoverPause, cycle };
}

export function HeroBackdrop({ index }: { index: number }) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 overflow-hidden"
      // Dissolve into the page (and its aurora) instead of ending on a hard edge.
      style={{ maskImage: "linear-gradient(to bottom, black 62%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 62%, transparent 100%)" }}
    >
      {SLIDES.map((s, i) => {
        const active = i === index;
        // Only the first slide loads eagerly; the rest load once they are next up.
        const near = i === index || i === (index + 1) % SLIDES.length || loaded[i];
        return (
          <img
            key={s.id}
            src={near ? `/hero/${s.file}-1600.webp` : undefined}
            srcSet={near ? srcSet(s.file) : undefined}
            sizes="100vw"
            alt=""
            decoding="async"
            fetchPriority={i === 0 ? "high" : "low"}
            onLoad={() => setLoaded((l) => ({ ...l, [i]: true }))}
            className={clsx("hero-slide absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-[cubic-bezier(0.2,0,0,1)]", active ? "is-active opacity-100" : "opacity-0")}
            style={{ objectPosition: s.focus }}
          />
        );
      })}
      {/* Legibility: fade from the page colour on the text side; on phones the text spans the art, so add an even scrim. */}
      <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--bg)_58%,transparent)] sm:hidden" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--bg)_0%,color-mix(in_oklab,var(--bg)_88%,transparent)_30%,color-mix(in_oklab,var(--bg)_35%,transparent)_58%,transparent_80%)]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[color-mix(in_oklab,var(--bg)_70%,transparent)] to-transparent" />
    </div>
  );
}

export function CarouselControls({
  index,
  go,
  paused,
  setPaused,
  running,
  cycle,
  onPlay,
}: ReturnType<typeof useCarousel> & { onPlay(id: Slide["id"], e: { clientX: number; clientY: number }): void }) {
  const current = SLIDES[index];
  const live = useRef(false);
  useEffect(() => {
    live.current = true;
  }, []);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="eyebrow">Now showing</p>
        <p aria-live={live.current && paused ? "polite" : "off"} className="text-sm font-medium text-ink">
          {current.name} · <span className="text-ink-dim">{current.tag}</span>
        </p>
        <button
          type="button"
          onClick={(e) => onPlay(current.id, e)}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-[color-mix(in_oklab,var(--surface-1)_60%,transparent)] px-3.5 text-sm font-medium text-ink backdrop-blur transition-ui hover:border-primary hover:text-primary-text"
        >
          Play {current.name} <ArrowRight size={14} aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Play slideshow" : "Pause slideshow"}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong bg-[color-mix(in_oklab,var(--surface-1)_60%,transparent)] text-ink backdrop-blur transition-ui hover:border-primary"
        >
          {paused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
        </button>
        <div role="tablist" aria-label="Game worlds" className="grid flex-1 grid-cols-3 gap-2">
          {SLIDES.map((s, i) => (
            <button key={s.id} type="button" role="tab" aria-selected={i === index} aria-label={`Show ${s.name}`} onClick={() => go(i)} className="group flex flex-col gap-1.5 py-1 text-left">
              <span className={clsx("text-xs font-medium transition-ui", i === index ? "text-ink" : "text-ink-faint group-hover:text-ink-dim")}>{s.name}</span>
              <span className="relative h-[3px] overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--text)_18%,transparent)]">
                <span
                  key={`${i}-${cycle}`}
                  className={clsx("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-secondary", i === index ? (running ? "hero-progress" : "w-full") : i < index ? "w-full opacity-50" : "w-0")}
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const SLIDE_DURATION_MS = SLIDE_MS;
