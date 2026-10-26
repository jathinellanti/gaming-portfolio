import { useId } from "react";
import { BlockVignette } from "./BlockVignette";
import { NeonVignette } from "./NeonVignette";
import { CityVignette } from "./CityVignette";

export const POSTER_LABEL =
  "Illustration of three game worlds: a floating voxel island with a tree and a pond, a neon skyscraper in the rain, and a sunny coastal city block with palm trees and a red car.";

/** The hero's static poster: all three worlds in one isometric scene. Also the permanent no-3D fallback. */
export function HeroPoster({ className }: { className?: string }) {
  const id = `p${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="34 0 690 700" role="img" aria-label={POSTER_LABEL} className={className} preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id={`${id}-ember`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="var(--primary)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-cool`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#3ef0ff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#3ef0ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-sun`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffb36b" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffb36b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="380" cy="400" rx="380" ry="300" fill={`url(#${id}-ember)`} />
      <ellipse cx="560" cy="200" rx="200" ry="220" fill={`url(#${id}-cool)`} />
      <ellipse cx="470" cy="560" rx="230" ry="140" fill={`url(#${id}-sun)`} />

      <g transform="translate(555 345)">
        <g className="art-float art-float-b">
          <NeonVignette id={`${id}-neon`} />
        </g>
      </g>
      <g transform="translate(205 285)">
        <g className="art-float art-float-a">
          <BlockVignette />
        </g>
      </g>
      <g transform="translate(420 455)">
        <g className="art-float art-float-c">
          <CityVignette />
        </g>
      </g>
    </svg>
  );
}

/** One world on its own, framed for a card (World Select). */
export function WorldVignette({ world, className }: { world: "block" | "neon" | "city"; className?: string }) {
  const id = `w${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const frame = {
    block: { viewBox: "-175 -120 350 360", el: <BlockVignette /> },
    neon: { viewBox: "-150 -310 300 410", el: <NeonVignette id={`${id}-neon`} /> },
    city: { viewBox: "-150 -170 400 420", el: <CityVignette /> },
  }[world];
  return (
    <svg viewBox={frame.viewBox} aria-hidden className={className} preserveAspectRatio="xMidYMid meet">
      <g className="art-float art-float-a">{frame.el}</g>
    </svg>
  );
}
