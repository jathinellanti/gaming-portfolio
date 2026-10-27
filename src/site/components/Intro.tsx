import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useContent } from "../../content/useContent";
import { useIntro } from "../intro";
import { Monogram } from "./Monogram";

// The opening screen: the monogram draws itself in over drifting gold dust; a click
// (or Enter/Space/Esc) lifts it away and the portfolio's own entrance plays.
const LEAVE_MS = 950;

export function Intro() {
  const open = useIntro((s) => s.open);
  const enter = useIntro((s) => s.enter);
  const { profile } = useContent();
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const button = useRef<HTMLButtonElement>(null);

  const go = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    enter();
    window.setTimeout(() => setLeaving(false), LEAVE_MS);
  }, [enter]);

  // A fixed scatter of dust motes (deterministic, so it doesn't jump between renders).
  const dust = useMemo(() => {
    let h = 7;
    const r = () => ((h = (h * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: 46 }, () => ({ left: r() * 100, top: r() * 100, size: 1 + r() * 2.4, dur: 9 + r() * 14, delay: -r() * 20, o: 0.25 + r() * 0.6 }));
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    button.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") go();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go]);

  if (!open && !leaving) return null;
  return (
    <div
      data-theme="dark"
      role="dialog"
      aria-modal="true"
      aria-label={`${profile.name}: portfolio`}
      onClick={go}
      className={clsx("intro fixed inset-0 z-[120] grid cursor-pointer place-items-center overflow-hidden bg-bg", leaving && "is-leaving")}
    >
      <div aria-hidden className="intro-glow" />
      <div aria-hidden className="absolute inset-0">
        {dust.map((d, i) => (
          <span
            key={i}
            className="intro-mote"
            style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, opacity: d.o, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
          />
        ))}
      </div>
      <div className="intro-stage relative flex flex-col items-center px-6 text-center">
        <Monogram size={148} lockup animate />
        <p className="intro-tag mt-9 font-mono text-[11px] uppercase tracking-[0.42em] text-ink-dim">
          {profile.title} · Portfolio
        </p>
        <button
          ref={button}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go();
          }}
          className="intro-enter group mt-10 inline-flex items-center gap-3 rounded-full border border-[color-mix(in_oklab,var(--foil-2)_55%,transparent)] px-6 py-3 text-sm tracking-[0.2em] text-[var(--foil-1)] transition-ui hover:border-[var(--foil-2)] hover:bg-[color-mix(in_oklab,var(--foil-2)_10%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--foil-2)]"
        >
          <span className="relative inline-flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--foil-2)] opacity-60" />
            <span className="relative size-2 rounded-full bg-[var(--foil-2)]" />
          </span>
          CLICK TO ENTER
        </button>
      </div>
    </div>
  );
}
