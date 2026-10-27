import * as m from "motion/react-m";
import { ArrowDown, ArrowRight, FileText, Mail } from "lucide-react";
import { BRANDS, BrandIcon } from "../components/BrandIcon";
import { useContent } from "../../content/useContent";
import { ButtonLink } from "../components/Button";
import { useRealmTransition } from "../../play/RealmTransition";
import { CarouselControls, HeroBackdrop, useCarousel } from "./HeroCarousel";
import { WORLDS } from "../../play/worlds";
import { useIntro } from "../intro";
import { TypedText } from "../components/TypedText";

/** Playable worlds open directly; ones still in development open their World Select card. */
const worldHref = (id: string) => (WORLDS.find((w) => w.id === id)?.status === "available" ? `/play/${id}` : `/play#${id}`);

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.06 + i * 0.07, duration: 0.5, ease: [0.2, 0, 0, 1] as const } }),
};

// Full-bleed key-art carousel with the name set huge in condensed chrome type
// (after editorial portfolio heroes), role and intro beneath, CTAs, carousel controls.
export function Hero() {
  const { profile } = useContent();
  const enterRealm = useRealmTransition();
  const carousel = useCarousel();
  // Hold the entrance until the monogram intro has been dismissed.
  const show = useIntro((s) => !s.open) ? "show" : "hidden";

  return (
    <section aria-labelledby="hero-title" className="relative isolate -mt-[var(--nav-h)] flex min-h-[100dvh] flex-col overflow-hidden pt-[var(--nav-h)]">
      <HeroBackdrop index={carousel.index} />

      <div className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-between gap-10 px-4 pb-24 pt-10 sm:px-6 lg:justify-center lg:px-8 lg:pb-40 lg:pt-6">
        <div className="max-w-[780px]">
          <m.p variants={rise} initial="hidden" animate={show} custom={0} className="eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-[color-mix(in_oklab,var(--surface-1)_55%,transparent)] px-3 py-1">
            <span className="relative inline-flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60" />
              <span className="relative size-2 rounded-full bg-success" />
            </span>
            Portfolio · {profile.location}
          </m.p>

          <m.p variants={rise} initial="hidden" animate={show} custom={1} className="font-lux mt-7 text-[length:var(--step-1)] italic tracking-wide text-ink-dim">
            Hi, I&apos;m
          </m.p>
          {/* Generous padding (offset by a negative margin) gives the script's swashes room:
              gradient-filled text only paints inside its own box, so tight boxes clip the E. */}
          <m.h1
            id="hero-title"
            variants={rise}
            initial="hidden"
            animate={show}
            custom={2}
            className="font-script -ml-[0.3em] mt-1 pb-[0.16em] pl-[0.3em] pr-[0.25em] pt-[0.06em] text-[clamp(4rem,9.2vw,7.6rem)] font-normal leading-[1.12] dark:drop-shadow-[0_4px_24px_rgb(0_0_0/0.45)]"
          >
            <TypedText text={profile.name} start={show === "show"} delay={450} className="text-chrome -ml-[0.3em] -mr-[0.25em] pl-[0.3em] pr-[0.25em]" />
          </m.h1>

          <m.div variants={rise} initial="hidden" animate={show} custom={3} className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="font-mono text-[length:var(--step-1)] font-medium uppercase tracking-[0.18em] text-ink">{profile.title}</p>
            {profile.subtitle && (
              <p className="flex items-center gap-2 text-[length:var(--step-0)] text-primary-text">
                <span aria-hidden className="h-px w-6 bg-[var(--primary-text)]" />
                {profile.subtitle}
              </p>
            )}
          </m.div>
          <m.p variants={rise} initial="hidden" animate={show} custom={4} className="mt-5 max-w-[56ch] text-[length:var(--step-1)] leading-relaxed text-ink-dim">
            {profile.intro}
          </m.p>

          <m.div variants={rise} initial="hidden" animate={show} custom={5} className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink to="/cv" variant="primary" size="lg">
              <FileText size={17} aria-hidden />
              View My CV
            </ButtonLink>
            <a
              href="#projects"
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-control)] border border-line-strong bg-[color-mix(in_oklab,var(--surface-1)_60%,transparent)] px-5 font-medium text-ink shadow-[var(--shadow-1)] transition-ui hover:bg-surface-2 active:translate-y-px"
            >
              Explore My Projects
              <ArrowDown size={16} aria-hidden />
            </a>
          </m.div>

          <m.div variants={rise} initial="hidden" animate={show} custom={6} className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={(e) => enterRealm("/play", e)}
              className="group inline-flex items-center gap-4 rounded-full border border-line-strong bg-[color-mix(in_oklab,var(--surface-1)_60%,transparent)] py-2 pl-2 pr-5 text-left transition-ui hover:border-primary hover:bg-surface-2"
            >
              <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-on-primary shadow-[0_0_24px_var(--primary-soft)] transition-ui group-hover:scale-105">
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden fill="currentColor">
                  <path d="M4 2.5v11l9-5.5z" />
                </svg>
              </span>
              <span className="flex flex-col">
                <span className="font-medium text-ink">Enter the Developer&apos;s Realm</span>
                <span className="font-mono text-xs tracking-wide text-ink-dim">
                  3 WORLDS<span className="hidden sm:inline"> · MY CV, PLAYABLE</span>
                </span>
              </span>
              <ArrowRight size={16} aria-hidden className="ml-1 text-ink-dim transition-ui group-hover:translate-x-0.5 group-hover:text-ink" />
            </button>
            <ul className="flex items-center gap-1" aria-label="Profiles">
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
            </ul>
          </m.div>
        </div>

        <m.div
          variants={rise}
          initial="hidden"
          animate={show}
          custom={7}
          className="panel w-full max-w-[540px] self-end p-4 lg:absolute lg:bottom-32 lg:right-8"
          onPointerEnter={() => carousel.setHoverPause(true)}
          onPointerLeave={() => carousel.setHoverPause(false)}
          onFocus={() => carousel.setHoverPause(true)}
          onBlur={() => carousel.setHoverPause(false)}
        >
          <CarouselControls {...carousel} onPlay={(id, e) => enterRealm(worldHref(id), e)} />
        </m.div>
      </div>
    </section>
  );
}
