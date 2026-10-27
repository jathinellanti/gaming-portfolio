import { useId } from "react";
import { Droplets, MapPin, Wind } from "lucide-react";

// Illustration for the Weather Information System, after glassmorphism weather-app
// shots: a glossy sun behind a frosted glass cloud, a "today" glass card, and tiles
// for the four city pages the real app has (Mumbai, Delhi, Bangalore, Kolkata).
// The readings are illustrative, which is why the cover is labelled "Illustration".

type Kind = "sun" | "partly" | "rain" | "storm";

/** A small glossy weather icon: gradient sun, frosted cloud, rain or a bolt. */
function Icon({ kind, className }: { kind: Kind; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const sun = kind === "sun" || kind === "partly";
  const cloud = kind !== "sun";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}-sun`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset="0.45" stopColor="#ffc93c" />
          <stop offset="1" stopColor="#ff8a1f" />
        </radialGradient>
        <linearGradient id={`${id}-cloud`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="1" stopColor="#dbe7ff" stopOpacity="0.82" />
        </linearGradient>
      </defs>
      {sun && <circle cx={kind === "sun" ? 32 : 40} cy={kind === "sun" ? 32 : 24} r={kind === "sun" ? 17 : 13} fill={`url(#${id}-sun)`} />}
      {cloud && (
        <path
          d="M18 50h30a10 10 0 0 0 1.5-19.9A14 14 0 0 0 22.6 27 11.5 11.5 0 0 0 18 50z"
          fill={`url(#${id}-cloud)`}
          stroke="#ffffff"
          strokeOpacity="0.9"
          strokeWidth="1.2"
          transform={kind === "partly" ? "translate(-2 2)" : "translate(0 -4)"}
        />
      )}
      {kind === "rain" &&
        [22, 32, 42].map((x) => <path key={x} className="cover-rain" style={{ animationDelay: `${x * 0.02}s` }} d={`M${x} 50 l-3 7`} stroke="#6fc3ff" strokeWidth="3" strokeLinecap="round" />)}
      {kind === "storm" && <path d="M33 47 l-6 10 h6 l-3 8 10-12 h-6 l4-6z" fill="#ffd23f" stroke="#ff9f1c" strokeWidth="0.8" />}
    </svg>
  );
}

const CITIES: { name: string; kind: Kind; temp: number }[] = [
  { name: "Mumbai", kind: "partly", temp: 29 },
  { name: "Delhi", kind: "sun", temp: 33 },
  { name: "Bangalore", kind: "rain", temp: 24 },
  { name: "Kolkata", kind: "storm", temp: 28 },
];

const glass = "border border-white/50 bg-white/20 shadow-[0_1.2cqw_3cqw_-1cqw_rgb(20_40_120/0.45),inset_0_1px_0_rgb(255_255_255/0.7)]";

export function WeatherCover() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-[linear-gradient(158deg,#9ad9ff_0%,#4f86ff_46%,#7a5cff_100%)] text-white">
      {/* Soft bokeh */}
      <div className="absolute -left-[8%] top-[52%] size-[30cqw] rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.28),transparent)]" />
      <div className="absolute right-[18%] -top-[12%] size-[26cqw] rounded-full bg-[radial-gradient(closest-side,rgb(255_220_160/0.35),transparent)]" />

      {/* Hero icon: a glossy sun with turning rays, a frosted cloud in front */}
      <div className="absolute left-[5%] top-[8%] size-[40cqw]">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <defs>
            <radialGradient id={`${id}-sun`} cx="0.42" cy="0.38" r="0.62">
              <stop offset="0" stopColor="#fff6c4" />
              <stop offset="0.4" stopColor="#ffd04a" />
              <stop offset="1" stopColor="#ff8a1f" />
            </radialGradient>
            <radialGradient id={`${id}-glow`}>
              <stop offset="0.45" stopColor="#ffc94a" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffc94a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0.2" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.92" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.34" />
            </linearGradient>
          </defs>
          <circle cx="122" cy="74" r="70" fill={`url(#${id}-glow)`} />
          <g className="cover-spin" style={{ transformOrigin: "122px 74px" }}>
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x="119" y="10" width="6" height="16" rx="3" fill="#ffd45a" transform={`rotate(${i * 36} 122 74)`} />
            ))}
          </g>
          <circle cx="122" cy="74" r="38" fill={`url(#${id}-sun)`} />
          <path d="M40 160h96a30 30 0 0 0 4-59.7A42 42 0 0 0 58 96a34 34 0 0 0-18 64z" fill={`url(#${id}-glass)`} stroke="#ffffff" strokeOpacity="0.85" strokeWidth="2" />
          <path d="M58 110a26 26 0 0 1 20-10" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Today card */}
      <div className={`absolute right-[5%] top-[9%] w-[44%] rounded-[2.4cqw] p-[2.4cqw] ${glass}`}>
        <p className="flex items-center gap-[0.8cqw] text-[1.9cqw] font-medium">
          <MapPin className="size-[2cqw]" strokeWidth={2.4} />
          Mumbai
          <span className="ml-auto text-[1.5cqw] font-normal text-white/80">Today</span>
        </p>
        <p className="mt-[0.6cqw] text-[9cqw] font-extralight leading-none tracking-tight">29°</p>
        <p className="text-[1.9cqw] text-white/90">Partly cloudy</p>
        <div className="mt-[1.6cqw] flex gap-[2cqw] text-[1.5cqw] text-white/85">
          <span className="flex items-center gap-[0.6cqw]">
            <Droplets className="size-[1.8cqw]" /> 72%
          </span>
          <span className="flex items-center gap-[0.6cqw]">
            <Wind className="size-[1.8cqw]" /> 12 km/h
          </span>
        </div>
      </div>

      {/* City tiles */}
      <ul className="absolute bottom-[7%] left-[5%] right-[5%] grid grid-cols-4 gap-[1.6cqw]">
        {CITIES.map((c) => (
          <li key={c.name} className={`flex flex-col items-center rounded-[1.8cqw] px-[1cqw] py-[1.4cqw] ${glass}`}>
            <Icon kind={c.kind} className="size-[6.4cqw]" />
            <span className="mt-[0.4cqw] text-[1.55cqw] font-medium">{c.name}</span>
            <span className="text-[2.4cqw] font-light">{c.temp}°</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
