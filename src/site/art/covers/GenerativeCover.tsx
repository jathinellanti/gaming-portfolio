import { useId } from "react";

// Fallback cover for projects without screenshots or bespoke art: abstract,
// seeded from the slug so each project gets its own consistent composition.
export function GenerativeCover({ seed, title }: { seed: string; title: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const r = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
  const hue = Math.floor(r() * 360);
  return (
    <svg viewBox="0 0 640 400" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 70% 18%)`} />
          <stop offset="1" stopColor={`hsl(${(hue + 70) % 360} 70% 12%)`} />
        </linearGradient>
      </defs>
      <rect width="640" height="400" fill={`url(#${id}-g)`} />
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} className="cover-drift-a" style={{ animationDelay: `${-i * 2}s` }} cx={r() * 640} cy={r() * 400} r={40 + r() * 90} fill={`hsl(${(hue + i * 25) % 360} 90% 60%)`} opacity={0.12} />
      ))}
      <text x="40" y="350" fill="#e8ecff" fontSize="40" fontFamily="var(--font-display-family)">
        {title}
      </text>
    </svg>
  );
}
