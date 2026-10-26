import { memo } from "react";
import { NEON } from "./palette";
import { box, faceMatrix, hash, lerpFace, pts, type Pt } from "./iso";

// A rain-soaked megatower: lit window grid, a holographic billboard, a vertical
// neon sign and an antenna beacon on a wet plinth. `id` keeps filter ids unique
// when several copies of the art are on one page.

const S = 19;

function Windows({ face, cols, rows, seed, dim }: { face: Pt[]; cols: number; rows: number; seed: number; dim: number }) {
  const out = [];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const r = hash(seed, i, j);
      const at = (u: number, v: number) => lerpFace(face, (i + u) / cols, (j + v) / rows);
      const inset: Pt[] = [at(0.18, 0.22), at(0.82, 0.22), at(0.82, 0.78), at(0.18, 0.78)];
      const lit = r > 0.62;
      const color = r > 0.93 ? NEON.magenta : r > 0.8 ? NEON.amber : NEON.cyan;
      out.push(<polygon key={`${i}-${j}`} points={pts(inset)} fill={lit ? color : NEON.windowOff} opacity={lit ? dim : 0.9} />);
    }
  return <>{out}</>;
}

export const NeonVignette = memo(function NeonVignette({ id }: { id: string }) {
  const plinth = box(-1.2, -1.2, -0.7, 5.4, 5.4, 0.7, S);
  const back = box(-3.2, 0.6, 0, 2, 2.2, 7.5, S);
  const tower = box(0, 0, 0, 3, 3, 11, S);
  const crown = box(0.6, 0.6, 11, 1.8, 1.8, 2.4, S);
  const antennaBase = box(1.35, 1.35, 13.4, 0.3, 0.3, 0, S).top[0];
  const glow = `url(#${id}-glow)`;

  // Billboard on the tower's left face, sign on its right face (in face-local px).
  const leftOrigin = tower.left[0];
  const rightOrigin = tower.right[0];
  const faceW = 3 * S;

  return (
    <g>
      <defs>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`${id}-holo`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={NEON.magenta} stopOpacity="0.95" />
          <stop offset="1" stopColor={NEON.cyan} stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id={`${id}-puddle`}>
          <stop offset="0" stopColor={NEON.cyan} stopOpacity="0.35" />
          <stop offset="0.6" stopColor={NEON.magenta} stopOpacity="0.12" />
          <stop offset="1" stopColor={NEON.magenta} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Wet-ground reflection */}
      <ellipse cx={0} cy={plinth.left[3][1] + 18} rx={150} ry={34} fill={`url(#${id}-puddle)`} />

      {/* Plinth */}
      <polygon points={pts(plinth.left)} fill={NEON.plinth} />
      <polygon points={pts(plinth.right)} fill={NEON.plinth} />
      <polygon points={pts(plinth.top)} fill={NEON.plinthEdge} />
      <polyline points={pts([plinth.left[0], plinth.left[1], plinth.right[1]])} fill="none" stroke={NEON.cyan} strokeWidth={1.4} filter={glow} />

      {/* Back tower */}
      <polygon points={pts(back.left)} fill={NEON.towerLeft} />
      <polygon points={pts(back.right)} fill={NEON.towerRight} />
      <polygon points={pts(back.top)} fill={NEON.towerTop} />
      <Windows face={back.left} cols={4} rows={14} seed={3} dim={0.55} />
      <Windows face={back.right} cols={4} rows={14} seed={4} dim={0.4} />

      {/* Main tower */}
      <polygon points={pts(tower.left)} fill={NEON.towerLeft} />
      <polygon points={pts(tower.right)} fill={NEON.towerRight} />
      <polygon points={pts(tower.top)} fill={NEON.towerTop} />
      <Windows face={tower.left} cols={6} rows={22} seed={11} dim={0.9} />
      <Windows face={tower.right} cols={6} rows={22} seed={12} dim={0.6} />

      {/* Holographic billboard (left face) */}
      <g transform={faceMatrix("left", leftOrigin)}>
        <rect x={6} y={2.3 * S} width={faceW - 12} height={2.3 * S} fill={`url(#${id}-holo)`} opacity={0.88} filter={glow} />
        {Array.from({ length: 9 }, (_, k) => (
          <line key={k} x1={6} x2={faceW - 6} y1={2.3 * S + 5 * k + 3} y2={2.3 * S + 5 * k + 3} stroke="#000" strokeOpacity={0.18} />
        ))}
        <text x={faceW / 2} y={3.25 * S} textAnchor="middle" fontFamily="var(--font-mono-family)" fontWeight={700} fontSize={11} fill="#fff" letterSpacing="1.5">
          UNITY · C#
        </text>
        <text x={faceW / 2} y={3.25 * S + 14} textAnchor="middle" fontFamily="var(--font-mono-family)" fontSize={7.5} fill="#fff" fillOpacity={0.85} letterSpacing="1">
          REACT · NODE · DJANGO
        </text>
      </g>

      {/* Vertical neon sign (right face) */}
      <g transform={faceMatrix("right", rightOrigin)}>
        <rect x={faceW - 22} y={0.7 * S} width={15} height={4.6 * S} fill="#07080f" stroke={NEON.yellow} strokeWidth={1.2} filter={glow} />
        {"NEON".split("").map((ch, k) => (
          <text
            key={k}
            x={faceW - 14.5}
            y={0.7 * S + 17 + k * 21}
            textAnchor="middle"
            fontFamily="var(--font-mono-family)"
            fontWeight={800}
            fontSize={14}
            fill={NEON.yellow}
            filter={glow}
          >
            {ch}
          </text>
        ))}
      </g>

      {/* Crown + antenna */}
      <polygon points={pts(crown.left)} fill={NEON.towerLeft} />
      <polygon points={pts(crown.right)} fill={NEON.towerRight} />
      <polygon points={pts(crown.top)} fill={NEON.towerTop} />
      <polyline points={pts([crown.left[0], crown.left[1], crown.right[1]])} fill="none" stroke={NEON.magenta} strokeWidth={1.3} filter={glow} />
      <line x1={antennaBase[0]} y1={antennaBase[1]} x2={antennaBase[0]} y2={antennaBase[1] - 46} stroke={NEON.plinthEdge} strokeWidth={2} />
      <circle className="art-blink" cx={antennaBase[0]} cy={antennaBase[1] - 47} r={2.6} fill={NEON.magenta} filter={glow} />

      {/* Rain */}
      <g className="art-rain" stroke={NEON.rain} strokeOpacity={0.4} strokeWidth={1}>
        {Array.from({ length: 46 }, (_, k) => {
          const x = (hash(k, 1) - 0.5) * 300;
          const y = -320 + hash(k, 2) * 420;
          const len = 9 + hash(k, 3) * 9;
          return <line key={k} x1={x} y1={y} x2={x - 2.5} y2={y + len} />;
        })}
      </g>
    </g>
  );
});
