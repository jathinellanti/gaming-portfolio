import { useEffect, useRef, type KeyboardEvent } from "react";
import { Link, useLocation } from "react-router";
import * as m from "motion/react-m";
import clsx from "clsx";
import { ArrowLeft, FileText, Gamepad2, Hammer, Keyboard, Play, X } from "lucide-react";
import { WORLDS, type World } from "./worlds";
import { WorldVignette } from "../site/art/HeroPoster";
import { WORLD_SCENE } from "../site/art/palette";
import { ExitBar } from "../platform/ExitBar";
import { useSettings } from "../platform/settings";
import { PageMeta } from "../site/meta";

const TITLE_STYLE: Record<World["id"], string> = {
  block: "font-mono font-extrabold tracking-[0.06em] text-[#f4f4f4] [text-shadow:3px_3px_0_#3a3a3a]",
  neon: "font-mono font-bold tracking-[0.14em] text-[#f3e600] [text-shadow:0_0_14px_rgb(243_230_0/0.55)]",
  city: "font-sans font-black italic tracking-tight text-white [text-shadow:2px_2px_0_#b8342c,4px_4px_0_rgb(0_0_0/0.35)]",
};

function WorldCard({ world, index }: { world: World; index: number }) {
  const available = world.status === "available";
  return (
    <m.li
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.07, duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="min-w-0"
    >
      <article
        id={world.id}
        data-world-card
        tabIndex={0}
        aria-labelledby={`${world.id}-title`}
        aria-describedby={`${world.id}-pitch`}
        className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#121218] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)] outline-none transition-ui hover:-translate-y-1 hover:border-white/25 focus-visible:-translate-y-1 focus-visible:border-[#ffb38f] focus-visible:ring-2 focus-visible:ring-[#ffb38f]/60"
      >
        <div className="relative h-[230px] overflow-hidden sm:h-[260px]" style={{ background: WORLD_SCENE[world.id] }}>
          <WorldVignette world={world.id} className="absolute inset-0 m-auto h-[92%] w-[92%] transition-transform duration-[250ms] ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.04]" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-white backdrop-blur">
            {available ? <Gamepad2 size={12} aria-hidden /> : <Hammer size={12} aria-hidden />}
            {available ? "Playable now" : "In development"}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
          <div>
            <h2 id={`${world.id}-title`} className={clsx("text-2xl", TITLE_STYLE[world.id])}>
              {world.title}
            </h2>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-white/55">{world.style}</p>
          </div>
          <p id={`${world.id}-pitch`} className="text-[0.95rem] leading-relaxed text-white/75">
            {world.pitch}
          </p>
          <ul className="space-y-1.5 text-sm text-white/70">
            {world.cv.map((c) => (
              <li key={c} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-[#ff7a45]" />
                {c}
              </li>
            ))}
          </ul>
          <p className="flex items-start gap-2 text-xs text-white/50">
            <Keyboard size={14} aria-hidden className="mt-px shrink-0" />
            {world.controls}
          </p>
          <div className="mt-auto pt-2">
            {available ? (
              <Link
                to={`/play/${world.id}`}
                aria-label={`Play ${world.title}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#ff7a45] font-medium text-[#1a0b04] transition-ui hover:bg-[#ff8f63]"
              >
                <Play size={15} aria-hidden />
                Play
              </Link>
            ) : (
              <button
                type="button"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
                className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[10px] border border-white/12 bg-white/5 font-medium text-white/55"
              >
                <Play size={15} aria-hidden />
                Play · coming in the next build
              </button>
            )}
          </div>
        </div>
      </article>
    </m.li>
  );
}

export function WorldSelect() {
  const { hash } = useLocation();
  const listRef = useRef<HTMLUListElement>(null);
  const welcomeDismissed = useSettings((s) => s.welcomeDismissed);
  const setSettings = useSettings((s) => s.set);

  useEffect(() => {
    const id = hash.replace("#", "");
    if (!id) return;
    const card = document.getElementById(id);
    if (card?.hasAttribute("data-world-card")) card.focus();
  }, [hash]);

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const cards = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-world-card]") ?? []);
    const i = cards.indexOf(document.activeElement as HTMLElement);
    if (i === -1) return;
    e.preventDefault();
    const next = e.key === "ArrowRight" ? (i + 1) % cards.length : (i - 1 + cards.length) % cards.length;
    cards[next].focus();
  };

  return (
    <div data-theme="dark" className="relative min-h-dvh overflow-x-clip bg-[#07070b] text-white">
      <PageMeta title="The Developer's Realm" description="Choose a world: three explorable games that present Ellanti Jathin's CV, skills and projects." />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="realm-fog realm-fog-a" />
        <div className="realm-fog realm-fog-b" />
        <div className="absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/0.5)_1px,transparent_1px)] [background-size:3px_3px] opacity-[0.04]" />
      </div>

      <ExitBar />

      <main className="relative mx-auto max-w-[1280px] px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pt-14">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ff9a70]">The Developer&apos;s Realm</p>
          <h1 className="text-display mt-4 text-[length:var(--step-4)] leading-[0.95]">Choose your world.</h1>
          <p className="mt-4 text-lg text-white/70">Three games, one CV. Each world tells the same real story (projects, skills, experience) through its own mechanics.</p>
        </header>

        {!welcomeDismissed && (
          <div role="note" className="mt-8 flex max-w-2xl items-start gap-4 rounded-[14px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">
            <p>
              Short on time? Everything here is also on the{" "}
              <Link to="/cv" className="font-medium text-white underline underline-offset-4">
                one-page CV
              </Link>
              . Nothing in the games is locked: menus open every section directly.
            </p>
            <button
              type="button"
              onClick={() => setSettings({ welcomeDismissed: true })}
              className="grid size-8 shrink-0 place-items-center rounded-md text-white/60 transition-ui hover:bg-white/10 hover:text-white"
              aria-label="Dismiss note"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        )}

        <ul ref={listRef} onKeyDown={onKeyDown} aria-label="Worlds" className="mt-8 grid gap-5 md:grid-cols-3">
          {WORLDS.map((w, i) => (
            <WorldCard key={w.id} world={w} index={i} />
          ))}
        </ul>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/60">
          <Link to="/" className="inline-flex items-center gap-2 rounded-md py-2 transition-ui hover:text-white">
            <ArrowLeft size={15} aria-hidden />
            Back to Professional
          </Link>
          <Link to="/cv" className="inline-flex items-center gap-2 rounded-md py-2 transition-ui hover:text-white">
            <FileText size={15} aria-hidden />
            Open CV instead
          </Link>
          <p className="w-full text-xs text-white/40 sm:w-auto">Tip: use ← → to move between worlds.</p>
        </footer>
      </main>
    </div>
  );
}
