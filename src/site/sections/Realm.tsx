import type { CSSProperties } from "react";
import { Link } from "react-router";
import { ArrowRight, Lock, Play } from "lucide-react";
import { WORLDS, type WorldId } from "../../play/worlds";
import { useRealmTransition } from "../../play/RealmTransition";
import { Reveal } from "../components/Reveal";

// The worlds gallery: one tall "character card" per game world (after game-studio
// sites' champion/region cards), each in its own glow colour, straight into the game.
const GLOW: Record<WorldId, string> = { block: "74 222 128", neon: "217 70 239", city: "251 146 60" };

export function Realm() {
  const enterRealm = useRealmTransition();
  return (
    <section aria-labelledby="realm-heading" className="relative isolate overflow-hidden">
      <div className="relative mx-auto w-full max-w-[1200px] px-4 pb-[var(--space-8)] pt-[var(--space-7)] sm:px-6 lg:px-8">
        <Reveal>
          <header className="mb-10 lg:mb-14">
            <div className="flex items-center gap-4">
              <p className="eyebrow shrink-0">The Developer&apos;s Realm</p>
              <span aria-hidden className="h-px flex-1 bg-line" />
              <Link to="/play" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-ink-dim underline-offset-4 transition-ui hover:text-ink hover:underline">
                World Select <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
            <h2 id="realm-heading" className="text-lux text-chrome mt-5 pb-[0.08em] text-[clamp(2.4rem,5.2vw,4.4rem)]">
              Three worlds. One CV.
            </h2>
            <p className="mt-5 max-w-[62ch] text-[length:var(--step-1)] text-ink-dim">Every section of this portfolio, rebuilt as a game you can walk through. Pick a world.</p>
          </header>
        </Reveal>
        <Reveal delay={80}>
          <ul className="grid gap-4 md:grid-cols-3">
            {WORLDS.map((w, i) => {
              const live = w.status === "available";
              return (
                <li key={w.id} className="group relative isolate flex aspect-[3/4] min-h-[460px] flex-col justify-end overflow-hidden rounded-[22px] border border-line-strong transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-1.5 hover:border-[rgb(var(--glow)/0.8)] hover:shadow-[0_24px_60px_-20px_rgb(var(--glow)/0.55)] md:min-h-0" style={{ "--glow": GLOW[w.id] } as CSSProperties}>
                  <img
                    src={`/art/${w.card}-900.webp`}
                    srcSet={`/art/${w.card}-600.webp 600w, /art/${w.card}-900.webp 900w`}
                    sizes="(min-width: 768px) 33vw, 100vw"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.06]"
                  />
                  <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgb(4_6_14/0.96)_8%,rgb(4_6_14/0.7)_42%,transparent_72%)]" />
                  <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                    <span className="text-condensed text-[2rem] text-white/90 drop-shadow">{String(i + 1).padStart(2, "0")}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-white/90">
                      <span aria-hidden className={live ? "size-1.5 rounded-full bg-[rgb(var(--glow))]" : "size-1.5 rounded-full bg-white/40"} />
                      {live ? "Playable" : "In development"}
                    </span>
                  </div>
                  <div className="p-5 text-white sm:p-6">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[rgb(var(--glow))]">{w.style}</p>
                    <h3 className="text-condensed mt-2 text-[clamp(2rem,3.2vw,2.6rem)]">{w.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/80">{w.pitch}</p>
                    <ul className="mt-3 space-y-1 text-xs text-white/70" aria-label={`${w.title}: your CV inside`}>
                      {w.cv.map((c) => (
                        <li key={c} className="flex gap-2">
                          <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-[rgb(var(--glow))]" />
                          {c}
                        </li>
                      ))}
                    </ul>
                    {live ? (
                      <button
                        type="button"
                        onClick={(e) => enterRealm(`/play/${w.id}`, e)}
                        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition-ui hover:bg-[rgb(var(--glow))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <Play size={15} aria-hidden fill="currentColor" />
                        Play {w.title}
                      </button>
                    ) : (
                      <Link to={`/play#${w.id}`} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-white/30 px-5 text-sm font-medium text-white/85 transition-ui hover:border-white/60">
                        <Lock size={14} aria-hidden />
                        Coming soon · details
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
