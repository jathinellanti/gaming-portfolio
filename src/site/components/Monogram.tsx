import { useId } from "react";
import clsx from "clsx";
import { useContent } from "../../content/useContent";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// The site's mark: the initials in a platinum high-contrast serif, the first set high
// and the second tucked beside and below it so they interlace, inside a double ring.
// Glyph positions are tuned to Playfair Display 500 at 58px (ink bounds measured with
// canvas measureText) so the pair sits centred. `lockup` adds the name above and
// below; `animate` draws the rings in and then resolves the letters (the intro).
export function Monogram({ size = 36, lockup = false, animate = false, className }: { size?: number; lockup?: boolean; animate?: boolean; className?: string }) {
  const { profile } = useContent();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [a, b] = initials(profile.name);
  const [first, ...rest] = profile.name.toUpperCase().split(/\s+/);
  const glyph = { fontFamily: "var(--font-lux-family)", fontWeight: 500, fontSize: 58 } as const;
  const badge = (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden className={clsx("shrink-0 overflow-visible", animate && "mark-animate")}>
      <defs>
        <linearGradient id={`${id}-foil`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="var(--foil-1)" />
          <stop offset="0.36" stopColor="var(--foil-2)" />
          <stop offset="0.54" stopColor="var(--foil-3)" />
          <stop offset="0.72" stopColor="var(--foil-1)" />
          <stop offset="1" stopColor="var(--foil-2)" />
        </linearGradient>
      </defs>
      <circle className="mark-frame" cx="60" cy="60" r="56.5" fill="none" stroke={`url(#${id}-foil)`} strokeWidth="2.2" pathLength={1} transform="rotate(-90 60 60)" />
      <circle className="mark-frame mark-frame-inner" cx="60" cy="60" r="51" fill="none" stroke={`url(#${id}-foil)`} strokeWidth="0.8" pathLength={1} transform="rotate(-90 60 60)" />
      <g className="mark-letters">
        <text x="36" y="66" style={glyph} fill={`url(#${id}-foil)`}>
          {a}
        </text>
        {/* A ring of the background colour around the second letter makes the pair interlace. */}
        <text x="63" y="84" style={glyph} fill={`url(#${id}-foil)`} stroke="var(--mark-bg)" strokeWidth="3" paintOrder="stroke">
          {b}
        </text>
      </g>
    </svg>
  );
  if (!lockup) return <span className={clsx("inline-flex", className)}>{badge}</span>;
  return (
    <span className={clsx("inline-flex flex-col items-center gap-3", className)} role="img" aria-label={`${profile.name} monogram`}>
      <span aria-hidden className="mark-word font-lux text-[length:var(--step--1)] tracking-[0.55em] text-[var(--foil-2)]">
        {first}
      </span>
      {badge}
      <span aria-hidden className="mark-word font-lux text-[length:var(--step--1)] tracking-[0.55em] text-[var(--foil-2)]">
        {rest.join(" ")}
      </span>
    </span>
  );
}
