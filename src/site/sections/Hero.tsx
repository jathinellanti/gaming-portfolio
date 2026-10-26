import { useEffect, useRef } from "react";
import * as m from "motion/react-m";
import { ArrowDown, ArrowRight, FileText, Mail } from "lucide-react";
import { BRANDS, BrandIcon } from "../components/BrandIcon";
import { useContent } from "../../content/useContent";
import { ButtonLink } from "../components/Button";
import { HeroPoster } from "../art/HeroPoster";
import { useRealmTransition } from "../../play/RealmTransition";
import { prefersReducedMotion } from "../../platform/webgl";

const WORLDS = [
  { id: "block", name: "Block World", hint: "Voxel survival-craft" },
  { id: "neon", name: "Neon City", hint: "Rain-soaked megacity" },
  { id: "city", name: "Open City", hint: "Sunset coastal sandbox" },
] as const;

const rise = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.06, duration: 0.25, ease: [0.2, 0, 0, 1] as const } }),
};

/** Pointer-follow spotlight: CSS variables updated once per frame; off for touch and reduced motion. */
function useSpotlight() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof matchMedia !== "function" || prefersReducedMotion() || !matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    el.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
    };
  }, []);
  return ref;
}

export function Hero() {
  const { profile } = useContent();
  const enterRealm = useRealmTransition();
  const ref = useSpotlight();
  const [first, ...rest] = profile.name.split(" ");

  return (
    <section ref={ref} aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(640px circle at var(--mx, 70%) var(--my, 40%), var(--spotlight), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full opacity-[0.5] [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]"
      />

      <div className="mx-auto grid min-h-[calc(100dvh-var(--nav-h))] max-w-[1200px] items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.02fr_1fr] lg:gap-6 lg:px-8 lg:pb-24">
        <div className="relative z-10">
          <m.p variants={rise} initial="hidden" animate="show" custom={0} className="eyebrow">
            Portfolio · {profile.location}
          </m.p>
          <m.h1
            id="hero-title"
            variants={rise}
            initial="hidden"
            animate="show"
            custom={1}
            className="text-display mt-5 text-[length:var(--step-5)] leading-[0.92] text-ink"
          >
            {first}
            <br />
            <span className="italic text-ink-dim">{rest.join(" ")}</span>
          </m.h1>
          <m.p variants={rise} initial="hidden" animate="show" custom={2} className="mt-6 text-[length:var(--step-2)] font-medium tracking-tight text-ink">
            {profile.title}
            {profile.subtitle && <span className="mt-1 block text-[length:var(--step-0)] font-normal tracking-normal text-primary-text">{profile.subtitle}</span>}
          </m.p>
          <m.p variants={rise} initial="hidden" animate="show" custom={3} className="mt-5 max-w-[52ch] text-[length:var(--step-1)] leading-relaxed text-ink-dim">
            {profile.intro}
          </m.p>

          <m.div variants={rise} initial="hidden" animate="show" custom={4} className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink to="/cv" variant="primary" size="lg">
              <FileText size={17} aria-hidden />
              View My CV
            </ButtonLink>
            <a
              href="#projects"
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-control)] border border-line-strong bg-surface-1 px-5 font-medium text-ink shadow-[var(--shadow-1)] transition-ui hover:bg-surface-2 active:translate-y-px"
            >
              Explore My Projects
              <ArrowDown size={16} aria-hidden />
            </a>
          </m.div>

          <m.div variants={rise} initial="hidden" animate="show" custom={5} className="mt-8">
            <button
              type="button"
              onClick={(e) => enterRealm("/play", e)}
              className="group inline-flex items-center gap-4 rounded-full border border-line-strong bg-[color-mix(in_oklab,var(--surface-1)_70%,transparent)] py-2 pl-2 pr-5 text-left backdrop-blur transition-ui hover:border-primary hover:bg-surface-2"
            >
              <span className="grid size-10 place-items-center rounded-full bg-primary text-on-primary shadow-[0_0_24px_var(--primary-soft)] transition-ui group-hover:scale-105">
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden fill="currentColor">
                  <path d="M4 2.5v11l9-5.5z" />
                </svg>
              </span>
              <span className="flex flex-col">
                <span className="font-medium text-ink">Enter the Developer&apos;s Realm</span>
                <span className="flex items-center gap-2 font-mono text-xs tracking-wide text-ink-dim">
                  <span className="relative inline-flex size-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60" />
                    <span className="relative size-2 rounded-full bg-success" />
                  </span>
                  3 WORLDS<span className="hidden sm:inline"> · MY CV, PLAYABLE</span>
                </span>
              </span>
              <ArrowRight size={16} aria-hidden className="ml-1 text-ink-dim transition-ui group-hover:translate-x-0.5 group-hover:text-ink" />
            </button>
          </m.div>

          <m.ul variants={rise} initial="hidden" animate="show" custom={6} className="mt-8 flex items-center gap-1" aria-label="Profiles">
            <li>
              <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-md text-ink-dim transition-ui hover:bg-surface-2 hover:text-ink" aria-label="GitHub profile">
                <BrandIcon icon={BRANDS.github} size={18} />
              </a>
            </li>
            <li>
              <a href={`mailto:${profile.email}`} className="grid size-10 place-items-center rounded-md text-ink-dim transition-ui hover:bg-surface-2 hover:text-ink" aria-label={`Email ${profile.email}`}>
                <Mail size={18} aria-hidden />
              </a>
            </li>
          </m.ul>
        </div>

        <div className="relative">
          <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}>
            <HeroPoster className="mx-auto h-auto w-full max-w-[680px] lg:-mr-6 lg:w-[calc(100%+3rem)] lg:max-w-none" />
          </m.div>
          <ul className="mx-auto mt-2 grid max-w-[560px] grid-cols-3 gap-2" aria-label="Game worlds">
            {WORLDS.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={(e) => enterRealm(`/play#${w.id}`, e)}
                  className="flex w-full flex-col items-center rounded-[var(--radius-control)] px-2 py-2 text-center transition-ui hover:bg-surface-2"
                >
                  <span className="text-sm font-medium text-ink">{w.name}</span>
                  <span className="text-xs text-ink-faint">{w.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
