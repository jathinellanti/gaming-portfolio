import { blockDef } from "../world/blocks";
import { getAtlasCanvas } from "../world/atlas";
import { TILE_PX, ATLAS_TILES_PER_ROW } from "../world/tiles";
import { skillSimpleIcon } from "../../../site/components/BrandIcon";

// Pixel-art item icons, generated once and cached as data URLs.
const cache = new Map<string, string>();

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function tileXY(index: number): [number, number] {
  return [(index % ATLAS_TILES_PER_ROW) * TILE_PX, Math.floor(index / ATLAS_TILES_PER_ROW) * TILE_PX];
}

/** Isometric block icon (32×32), drawn from the same atlas the world uses. */
export function blockIcon(id: number): string {
  const k = `b${id}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const def = blockDef(id);
  const atlas = getAtlasCanvas();
  const { c, ctx } = canvas(32);
  if (def.bucket === "cross") {
    const [sx, sy] = tileXY(def.side);
    ctx.drawImage(atlas, sx, sy, 16, 16, 0, 0, 32, 32);
  } else {
    const face = (tile: number, a: number, b: number, cc: number, d: number, e: number, f: number, shade: number) => {
      const [sx, sy] = tileXY(tile);
      ctx.setTransform(a, b, cc, d, e, f);
      ctx.drawImage(atlas, sx, sy, 16, 16, 0, 0, 16, 16);
      if (shade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${shade})`;
        ctx.fillRect(0, 0, 16, 16);
      }
    };
    face(def.top, 0.9375, 0.46875, -0.9375, 0.46875, 16, 1, 0); // top rhombus
    face(def.side, 0.9375, 0.46875, 0, 0.9375, 1, 8.5, 0.18); // left
    face(def.side, 0.9375, -0.46875, 0, 0.9375, 16, 16, 0.36); // right
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  const url = c.toDataURL();
  cache.set(k, url);
  return url;
}

function luminance(hex: string) {
  const n = parseInt(hex, 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

/** Threshold alpha so canvas antialiasing becomes crisp pixels, and add a 1px dark outline. */
function crisp(ctx: CanvasRenderingContext2D, size: number) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  const solid = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i++) {
    solid[i] = d[i * 4 + 3] > 100 ? 1 : 0;
    d[i * 4 + 3] = solid[i] ? 255 : 0;
  }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      if (solid[i]) continue;
      const near = (x > 0 && solid[i - 1]) || (x < size - 1 && solid[i + 1]) || (y > 0 && solid[i - size]) || (y < size - 1 && solid[i + size]);
      if (near) {
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 24;
        d[i * 4 + 3] = 255;
      }
    }
  ctx.putImageData(img, 0, 0);
}

/** A skill as a pixel item: its real brand mark rasterised to 16×16, or a lettered chip. */
export function skillIcon(id: string, name: string): string {
  const k = `s${id}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const { c, ctx } = canvas(16);
  const icon = skillSimpleIcon(id);
  if (icon) {
    let color = `#${icon.hex}`;
    if (luminance(icon.hex) < 0.28) color = "#e8e8e8";
    ctx.fillStyle = color;
    ctx.translate(1.5, 1.5);
    ctx.scale(13 / 24, 13 / 24);
    ctx.fill(new Path2D(icon.path));
  } else {
    ctx.fillStyle = "#3b6fd8";
    ctx.fillRect(1, 2, 14, 12);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name.replace(/\s.*/, "").slice(0, 3), 8, 8.5);
  }
  crisp(ctx, 16);
  const url = c.toDataURL();
  cache.set(k, url);
  return url;
}

function pixels(rows: string[], palette: Record<string, string>): string {
  const { c, ctx } = canvas(16);
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  return c.toDataURL();
}

/** A blueprint scroll: what a crafted project looks like as an item. */
export function projectIcon(seed: string): string {
  const k = `p${seed}`;
  const hit = cache.get(k);
  if (hit) return hit;
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const accent = ["#ffd36b", "#7cfc3c", "#ff7a45", "#ff5ad1"][h % 4];
  const url = pixels(
    [
      "................",
      "..############..",
      ".#bbbbbbbbbbbb#.",
      ".#bwwwwbbbbwbb#.",
      ".#bbbbwbbbbwbb#.",
      ".#bwwwwwwwwwbb#.",
      ".#bbbbbbwbbbbb#.",
      ".#bbbaaaaaaabb#.",
      ".#bbbabbbbbabb#.",
      ".#bwwwbbbbbabb#.",
      ".#bbbbbbbbbabb#.",
      ".#bbbbaaaaaabb#.",
      ".#bbbbbbbbbbbb#.",
      "..############..",
      "...#dd#..#dd#...",
      "................",
    ],
    { "#": "#1d2b4a", b: "#2f64c4", w: "#d6e6ff", a: accent, d: "#8a6a3e" },
  );
  cache.set(k, url);
  return url;
}

export function medalIcon(): string {
  const k = "medal";
  const hit = cache.get(k);
  if (hit) return hit;
  const url = pixels(
    [
      "....rr....rr....",
      "....rrr..rrr....",
      ".....rrrrrr.....",
      "......rbbr......",
      ".....######.....",
      "....#gGGGGg#....",
      "...#gGGyyGGg#...",
      "...#GGyGGyGG#...",
      "...#GGyGGyGG#...",
      "...#gGGyyGGg#...",
      "....#gGGGGg#....",
      ".....######.....",
      "................",
      "................",
      "................",
      "................",
    ],
    { r: "#c62828", b: "#1e3a8a", "#": "#7a5a12", g: "#f7c64a", G: "#fbe165", y: "#fff6b0" },
  );
  cache.set(k, url);
  return url;
}

export function bookIcon(): string {
  const k = "book";
  const hit = cache.get(k);
  if (hit) return hit;
  const url = pixels(
    [
      "................",
      "...##########...",
      "..#rrrrrrrrrw#..",
      "..#rrrrrrrrrw#..",
      "..#rryyyyrrrw#..",
      "..#rrrrrrrrrw#..",
      "..#rrrrrrrrrw#..",
      "..#rrrrrrrrrw#..",
      "..#rrrrrrrrrw#..",
      "..#rrrrrrrrrw#..",
      "..#rrrrrrrrrw#..",
      "..#rrrrrrrrrw#..",
      "..##########ww..",
      "...wwwwwwwwww...",
      "................",
      "................",
    ],
    { "#": "#3d1a12", r: "#8f2d2d", y: "#fcd34d", w: "#e8e0c8" },
  );
  cache.set(k, url);
  return url;
}
