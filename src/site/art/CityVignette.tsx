import { memo } from "react";
import { CITY } from "./palette";
import { box, hash, lerpFace, project, pts, type Pt } from "./iso";

// A sunny coastal city block: pastel buildings with window grids, a road with a
// car, palms along the sidewalk and the ocean lapping at the edge.

const S = 22;
const p = (x: number, y: number, z = 0): Pt => project(x, y, z, S);

function quad(x0: number, y0: number, x1: number, y1: number, z = 0): Pt[] {
  return [p(x0, y0, z), p(x1, y0, z), p(x1, y1, z), p(x0, y1, z)];
}

function Building({ x, y, w, d, h, tone, seed }: { x: number; y: number; w: number; d: number; h: number; tone: number; seed: number }) {
  const b = box(x, y, 0, w, d, h, S);
  const c = CITY.buildings[tone];
  const win = (face: Pt[], cols: number, rows: number, s2: number) =>
    Array.from({ length: cols * rows }, (_, k) => {
      const i = k % cols;
      const j = Math.floor(k / cols);
      const at = (u: number, v: number) => lerpFace(face, (i + u) / cols, (j + v) / rows);
      const lit = hash(s2, i, j) > 0.86;
      return <polygon key={k} points={pts([at(0.25, 0.3), at(0.75, 0.3), at(0.75, 0.75), at(0.25, 0.75)])} fill={lit ? CITY.windowLit : CITY.window} opacity={0.9} />;
    });
  const cols = Math.max(2, Math.round(w * 1.6));
  const colsR = Math.max(2, Math.round(d * 1.6));
  const rows = Math.max(2, Math.round(h * 1.4));
  return (
    <g>
      <polygon points={pts(b.left)} fill={c.left} />
      <polygon points={pts(b.right)} fill={c.right} />
      <polygon points={pts(b.top)} fill={c.top} />
      {win(b.left, cols, rows, seed)}
      {win(b.right, colsR, rows, seed + 1)}
      {/* Rooftop unit */}
      {(() => {
        const u = box(x + w * 0.3, y + d * 0.3, h, w * 0.35, d * 0.3, 0.35, S);
        return (
          <>
            <polygon points={pts(u.left)} fill={CITY.sidewalk} />
            <polygon points={pts(u.right)} fill={CITY.sidewalkShade} />
            <polygon points={pts(u.top)} fill="#e4ddd2" />
          </>
        );
      })()}
    </g>
  );
}

function Palm({ x, y, lean, seed }: { x: number; y: number; lean: number; seed: number }) {
  const [bx, by] = p(x, y);
  const h = 74 + hash(seed) * 18;
  const tx = bx + lean * 16;
  const ty = by - h;
  const fronds = Array.from({ length: 7 }, (_, k) => {
    const a = (k / 7) * Math.PI * 2 + hash(seed, k) * 0.4;
    const len = 26 + hash(seed, k, 2) * 10;
    const ex = tx + Math.cos(a) * len;
    const ey = ty + Math.sin(a) * len * 0.45 + 10;
    const cx = tx + Math.cos(a) * len * 0.55;
    const cy = ty + Math.sin(a) * len * 0.3 - 10;
    return (
      <path
        key={k}
        d={`M${tx},${ty} Q${cx},${cy} ${ex},${ey} Q${cx},${cy + 7} ${tx},${ty + 2}Z`}
        fill={k % 2 ? CITY.palmLeaf : CITY.palmLeafDark}
      />
    );
  });
  return (
    <g>
      <ellipse cx={bx + 10} cy={by + 2} rx={16} ry={5} fill="#000" opacity={0.12} />
      <path d={`M${bx - 2.5},${by} Q${bx + lean * 4},${by - h * 0.5} ${tx - 1.5},${ty} L${tx + 1.5},${ty} Q${bx + lean * 4 + 4},${by - h * 0.5} ${bx + 2.5},${by}Z`} fill={CITY.palmTrunk} />
      {fronds}
      <circle cx={tx} cy={ty + 2} r={3.2} fill={CITY.palmTrunk} />
    </g>
  );
}

export const CityVignette = memo(function CityVignette() {
  const slab = box(0, 0, -0.6, 8, 6.4, 0.6, S);
  const car = box(2.6, 4.75, 0, 1.5, 0.7, 0.38, S);
  const cabin = box(2.95, 4.8, 0.38, 0.8, 0.6, 0.3, S);
  return (
    <g>
      {/* Ocean */}
      <polygon points={pts(quad(-1, 6.4, 11, 9.5, -0.35))} fill={CITY.water} />
      <polygon points={pts(quad(8, -1.5, 11, 6.4, -0.35))} fill={CITY.water} />
      {Array.from({ length: 10 }, (_, k) => {
        const [x1, y1] = p(1 + k * 1.05, 7.2 + hash(k, 9) * 1.6, -0.35);
        return <line key={k} x1={x1} y1={y1} x2={x1 + 16} y2={y1 + 2} stroke={CITY.waterLight} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />;
      })}

      {/* Island slab */}
      <polygon points={pts(slab.left)} fill={CITY.sandShade} />
      <polygon points={pts(slab.right)} fill={CITY.sandShade} />
      <polygon points={pts(slab.top)} fill={CITY.sand} />
      <polygon points={pts(quad(0, 0, 8, 3.6))} fill={CITY.grass} />
      <polygon points={pts(quad(0, 3.6, 8, 4.4))} fill={CITY.sidewalk} />
      <polygon points={pts(quad(0, 4.4, 8, 5.9))} fill={CITY.road} />
      {Array.from({ length: 7 }, (_, k) => (
        <polygon key={k} points={pts(quad(0.3 + k * 1.15, 5.1, 0.9 + k * 1.15, 5.2))} fill={CITY.roadLine} />
      ))}

      <Building x={0.4} y={0.4} w={2.2} d={2.4} h={4.2} tone={0} seed={21} />
      <Building x={3.1} y={0.5} w={2.1} d={2.2} h={2.6} tone={1} seed={31} />
      <Building x={5.7} y={0.4} w={1.7} d={2.6} h={6} tone={2} seed={41} />

      <Palm x={1.2} y={3.95} lean={0.4} seed={1} />
      <Palm x={4.3} y={4} lean={-0.5} seed={2} />
      <Palm x={7.1} y={3.9} lean={0.6} seed={3} />

      {/* Car */}
      <ellipse cx={p(3.35, 5.1)[0]} cy={p(3.35, 5.1)[1] + 3} rx={24} ry={6} fill="#000" opacity={0.25} />
      <polygon points={pts(car.left)} fill={CITY.car.left} />
      <polygon points={pts(car.right)} fill={CITY.car.right} />
      <polygon points={pts(car.top)} fill={CITY.car.top} />
      <polygon points={pts(cabin.left)} fill={CITY.car.glass} />
      <polygon points={pts(cabin.right)} fill={CITY.car.glass} opacity={0.8} />
      <polygon points={pts(cabin.top)} fill={CITY.car.top} />
    </g>
  );
});
