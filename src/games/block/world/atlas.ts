import * as THREE from "three";
import { TILES, TILE_PX, ATLAS_PX, ATLAS_TILES_PER_ROW, type TileName } from "./tiles";

// Paints every 16×16 tile procedurally (original pixel art, seeded so it is the
// same on every load) into one atlas canvas. Main thread only.

type RGB = [number, number, number];
type Painter = (p: Pen) => void;

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

class Pen {
  private img: ImageData;
  private seed: number;
  constructor(img: ImageData, seed: number) {
    this.img = img;
    this.seed = seed;
  }
  rand(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  set(x: number, y: number, c: RGB | string, a = 255) {
    if (x < 0 || y < 0 || x >= TILE_PX || y >= TILE_PX) return;
    const col = typeof c === "string" ? hex(c) : c;
    const i = (y * TILE_PX + x) * 4;
    this.img.data[i] = col[0];
    this.img.data[i + 1] = col[1];
    this.img.data[i + 2] = col[2];
    this.img.data[i + 3] = a;
  }
  clear() {
    this.img.data.fill(0);
  }
  /** Each pixel picks a palette colour (weighted towards the middle entries). */
  noise(palette: string[]) {
    for (let y = 0; y < TILE_PX; y++) for (let x = 0; x < TILE_PX; x++) this.set(x, y, palette[Math.floor(this.rand() * palette.length)]);
  }
  rect(x0: number, y0: number, w: number, h: number, c: string, a = 255) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, c, a);
  }
  speckle(n: number, palette: string[], cluster = 1) {
    for (let k = 0; k < n; k++) {
      const x = Math.floor(this.rand() * TILE_PX);
      const y = Math.floor(this.rand() * TILE_PX);
      const c = palette[Math.floor(this.rand() * palette.length)];
      for (let dy = 0; dy < cluster; dy++) for (let dx = 0; dx < cluster; dx++) this.set(x + dx, y + dy, c);
    }
  }
}

const STONE = ["#7d7d7d", "#868686", "#8f8f8f", "#777777", "#909090", "#6f6f6f"];
const DIRT = ["#8b5d36", "#7a512e", "#966740", "#6e4628", "#86592f"];
const GRASS = ["#5fa83a", "#6dbb44", "#7cc94f", "#589f35", "#68b23f"];
const PLANK = ["#a8834f", "#b38c55", "#9c7845"];

function cobble(p: Pen, base: string[], mortar = "#4e4e4e") {
  p.noise(base);
  // Irregular stones: horizontal mortar lines with staggered vertical joints.
  const rows = [0, 4, 9, 13];
  for (const y of rows) for (let x = 0; x < 16; x++) p.set(x, y, mortar);
  const joints = [[3, 11], [6, 14], [2, 9], [5, 12]];
  rows.forEach((y, r) => {
    const yEnd = rows[r + 1] ?? 16;
    for (const jx of joints[r]) for (let yy = y; yy < yEnd; yy++) p.set(jx, yy, mortar);
  });
  p.speckle(10, ["#a0a0a0", "#9a9a9a"]);
}

function planks(p: Pen) {
  for (let y = 0; y < 16; y++) {
    const board = Math.floor(y / 4);
    for (let x = 0; x < 16; x++) {
      const shade = PLANK[(x + board * 3 + Math.floor(p.rand() * 2)) % PLANK.length];
      p.set(x, y, y % 4 === 3 ? "#7a5c33" : shade);
    }
    if (y % 4 !== 3) {
      const seam = (Math.floor(y / 4) * 7 + 3) % 16;
      p.set(seam, y, "#7a5c33");
    }
  }
}

function plant(p: Pen, petal: string[], stem = "#3f8f2e") {
  p.clear();
  for (let y = 7; y < 16; y++) p.set(7 + (y % 3 === 0 ? 1 : 0), y, stem);
  p.set(6, 11, stem);
  p.set(5, 10, "#4ea33a");
  p.set(9, 12, stem);
  p.set(10, 11, "#4ea33a");
  const cells = [[7, 4], [6, 5], [8, 5], [7, 6], [6, 4], [8, 4], [7, 5], [6, 6], [8, 6]];
  cells.forEach(([x, y], i) => p.set(x, y, petal[i % petal.length]));
  p.set(7, 5, "#f3d34a");
}

function cracks(p: Pen, stage: number) {
  p.clear();
  const n = 2 + stage * 2;
  for (let k = 0; k < n; k++) {
    let x = 8 + Math.floor(p.rand() * 3) - 1;
    let y = 8 + Math.floor(p.rand() * 3) - 1;
    const len = 3 + stage;
    const dx = p.rand() < 0.5 ? -1 : 1;
    const dy = p.rand() < 0.5 ? -1 : 1;
    for (let s = 0; s < len; s++) {
      p.set(x, y, "#000000", 200);
      if (p.rand() < 0.5) x += dx;
      else y += dy;
    }
  }
}

const PAINTERS: Record<TileName, Painter> = {
  grass_top: (p) => {
    p.noise(GRASS);
    p.speckle(10, ["#4f9532", "#86d45a"]);
  },
  grass_side: (p) => {
    p.noise(DIRT);
    for (let x = 0; x < 16; x++) {
      const drip = 3 + Math.floor(p.rand() * 3);
      for (let y = 0; y < drip; y++) p.set(x, y, GRASS[Math.floor(p.rand() * GRASS.length)]);
    }
  },
  dirt: (p) => {
    p.noise(DIRT);
    p.speckle(8, ["#5e3c22", "#a57a4f"]);
  },
  stone: (p) => {
    p.noise(STONE);
    p.speckle(6, ["#6a6a6a"], 2);
  },
  cobble: (p) => cobble(p, ["#7a7a7a", "#858585", "#8e8e8e", "#6c6c6c"]),
  mossy_cobble: (p) => {
    cobble(p, ["#7a7a7a", "#858585", "#8e8e8e", "#6c6c6c"]);
    p.speckle(14, ["#4f7a2e", "#5f8f37", "#3f6a26"], 2);
  },
  sand: (p) => {
    p.noise(["#dccf8f", "#e6daa0", "#d3c584", "#e1d597"]);
    p.speckle(6, ["#c9b977"]);
  },
  gravel: (p) => {
    p.noise(["#837d78", "#958e88", "#6f6a66", "#a29c96"]);
    p.speckle(12, ["#5d5853", "#b0a9a2"], 2);
  },
  log_side: (p) => {
    for (let x = 0; x < 16; x++) {
      const stripe = ["#5e4128", "#6f4d2b", "#4f361f", "#674728"][(x + (x > 7 ? 1 : 0)) % 4];
      for (let y = 0; y < 16; y++) p.set(x, y, p.rand() < 0.15 ? "#4a321c" : stripe);
    }
  },
  log_top: (p) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
        const c = d > 6.5 ? "#5e4128" : Math.floor(d) % 2 === 0 ? "#b48c55" : "#9a7444";
        p.set(x, y, c);
      }
  },
  leaves: (p) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const r = p.rand();
        if (r < 0.16) p.set(x, y, "#000000", 0);
        else p.set(x, y, ["#3f932f", "#347f27", "#4aa33a", "#2d6f22"][Math.floor(p.rand() * 4)]);
      }
  },
  planks,
  glass: (p) => {
    p.clear();
    for (let i = 0; i < 16; i++) {
      p.set(i, 0, "#dfeff5", 230);
      p.set(i, 15, "#a9c7d2", 230);
      p.set(0, i, "#dfeff5", 230);
      p.set(15, i, "#a9c7d2", 230);
    }
    for (let i = 0; i < 4; i++) p.set(3 + i, 3 + i, "#ffffff", 170);
    for (let i = 0; i < 3; i++) p.set(9 + i, 4 + i, "#ffffff", 140);
  },
  bookshelf: (p) => {
    planks(p);
    const spines = ["#8f2d2d", "#2d4f8f", "#2f7a3a", "#7a5a2d", "#5b2d7a", "#a8742f"];
    for (const top of [1, 9]) {
      p.rect(0, top, 16, 6, "#3d2a17");
      let x = 1;
      while (x < 15) {
        const w = 1 + Math.floor(p.rand() * 2);
        const h = 4 + Math.floor(p.rand() * 2);
        const c = spines[Math.floor(p.rand() * spines.length)];
        p.rect(x, top + 6 - h, w, h, c);
        p.set(x, top + 6 - h, "#e8e0c8");
        x += w + (p.rand() < 0.3 ? 1 : 0);
      }
      p.rect(0, top + 6, 16, 1, "#7a5c33");
    }
  },
  water: (p) => p.noise(["#3f76e4", "#3a6fd8", "#4680ee", "#3569d2"]),
  gold_ore: (p) => {
    p.noise(STONE);
    p.speckle(7, ["#fcee4b", "#e5c13d", "#fff6a0"], 2);
  },
  coal_ore: (p) => {
    p.noise(STONE);
    p.speckle(8, ["#2b2b2b", "#1c1c1c", "#3a3a3a"], 2);
  },
  brick: (p) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const row = Math.floor(y / 4);
        const off = row % 2 === 0 ? 0 : 4;
        const mortar = y % 4 === 3 || (x + off) % 8 === 7;
        p.set(x, y, mortar ? "#b7a59c" : ["#96422f", "#8a3b29", "#a14a35"][Math.floor(p.rand() * 3)]);
      }
  },
  stone_brick: (p) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const row = Math.floor(y / 8);
        const joint = row === 0 ? x === 7 : x === 15;
        const mortar = y % 8 === 7 || joint;
        const highlight = y % 8 === 0 && !joint;
        p.set(x, y, mortar ? "#5a5a5a" : highlight ? "#9c9c9c" : STONE[Math.floor(p.rand() * STONE.length)]);
      }
  },
  wool_red: (p) => {
    p.noise(["#a12722", "#b02e28", "#93211d", "#ba3530"]);
  },
  wool_white: (p) => {
    p.noise(["#e9ecec", "#dfe3e3", "#f4f6f6", "#d6dada"]);
  },
  crafting_top: (p) => {
    planks(p);
    p.rect(2, 2, 12, 12, "#8a6a3e");
    for (const v of [2, 6, 10, 13]) for (let i = 2; i < 14; i++) {
      p.set(v, i, "#4a3520");
      p.set(i, v, "#4a3520");
    }
  },
  crafting_side: (p) => {
    planks(p);
    p.rect(3, 4, 2, 9, "#6b6b6b"); // saw blade
    p.rect(2, 3, 4, 1, "#3d2a17");
    p.rect(10, 4, 4, 2, "#8a8a8a"); // hammer head
    p.rect(11, 6, 2, 7, "#5e4128");
  },
  chest_top: (p) => {
    p.noise(["#a06b2c", "#8f5f26", "#ad7634"]);
    for (let i = 0; i < 16; i++) {
      p.set(i, 0, "#4a2f12");
      p.set(i, 15, "#4a2f12");
      p.set(0, i, "#4a2f12");
      p.set(15, i, "#4a2f12");
    }
  },
  chest_side: (p) => {
    p.noise(["#a06b2c", "#8f5f26", "#ad7634"]);
    for (let i = 0; i < 16; i++) {
      p.set(i, 0, "#4a2f12");
      p.set(i, 15, "#4a2f12");
      p.set(0, i, "#4a2f12");
      p.set(15, i, "#4a2f12");
      p.set(i, 6, "#4a2f12");
    }
    p.rect(7, 5, 2, 4, "#c8c8c8");
    p.set(7, 8, "#555555");
  },
  lectern_top: (p) => {
    planks(p);
    p.rect(2, 3, 12, 10, "#e8e0c8");
    p.rect(7, 3, 2, 10, "#bfb49a");
    for (const y of [5, 7, 9, 11]) {
      p.rect(3, y, 3, 1, "#7d735f");
      p.rect(10, y, 3, 1, "#7d735f");
    }
  },
  lectern_side: (p) => {
    planks(p);
    p.rect(5, 2, 6, 14, "#7a5c33");
    p.rect(6, 3, 4, 12, "#8f6c3c");
  },
  spawner: (p) => {
    p.clear();
    for (let i = 0; i < 16; i++)
      for (let j = 0; j < 16; j++) if (i % 5 === 0 || j % 5 === 0 || i === 15 || j === 15) p.set(i, j, i % 5 === 0 && j % 5 === 0 ? "#3a3a46" : "#1d1d24");
    p.rect(6, 6, 4, 4, "#ff7a45", 180);
    p.set(7, 7, "#ffd36b", 220);
  },
  obsidian: (p) => {
    p.noise(["#140d1e", "#1d1229", "#100a18", "#22152f"]);
    p.speckle(6, ["#3a2752", "#4a3266"]);
  },
  portal: (p) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const a = Math.sin((x + y) * 0.7) + Math.cos((x - y) * 0.5) + p.rand() * 0.6;
        p.set(x, y, a > 1 ? "#9ff6ff" : a > 0.2 ? "#3ef0ff" : a > -0.6 ? "#1b9ab8" : "#0e5a78", 230);
      }
  },
  lantern: (p) => {
    p.rect(0, 0, 16, 16, "#2a2a30");
    p.rect(3, 3, 10, 10, "#ffd36b");
    p.rect(5, 5, 6, 6, "#fff1b0");
    for (let i = 3; i < 13; i += 3) {
      p.rect(i, 3, 1, 10, "#c98a2e");
    }
  },
  bedrock: (p) => p.noise(["#565656", "#2f2f2f", "#7a7a7a", "#1e1e1e", "#454545"]),
  flower_red: (p) => plant(p, ["#d62a1f", "#b51f16", "#e6463a"]),
  flower_yellow: (p) => plant(p, ["#f3d34a", "#e5c13d", "#fde77a"]),
  tall_grass: (p) => {
    p.clear();
    for (const [x, h] of [[2, 7], [4, 10], [6, 6], [8, 12], [10, 8], [12, 11], [14, 6], [5, 4], [11, 5]]) for (let y = 16 - h; y < 16; y++) p.set(x + (y % 4 === 0 ? 1 : 0), y, GRASS[(x + y) % GRASS.length]);
  },
  gold_block: (p) => {
    p.noise(["#f7d43c", "#fbe165", "#efc72c"]);
    for (let i = 0; i < 16; i++) {
      p.set(i, 0, "#fff6b0");
      p.set(0, i, "#fff6b0");
      p.set(i, 15, "#c99a1a");
      p.set(15, i, "#c99a1a");
    }
  },
  rune_top: (p) => {
    p.noise(["#140d1e", "#1d1229"]);
    p.rect(3, 3, 10, 10, "#8f2d2d");
    p.rect(4, 4, 8, 8, "#e8e0c8");
    for (const [x, y] of [[5, 6], [6, 5], [9, 6], [10, 9], [6, 10], [8, 8]]) p.set(x, y, "#2a9dd8");
  },
  rune_side: (p) => {
    p.noise(["#140d1e", "#1d1229", "#22152f"]);
    p.rect(0, 0, 16, 3, "#8f2d2d");
    for (const x of [2, 6, 10, 13]) p.set(x, 1, "#f3d34a");
    p.speckle(5, ["#3ef0ff"]);
  },
  frame: (p) => {
    p.rect(0, 0, 16, 16, "#6b4a28");
    p.rect(1, 1, 14, 14, "#8a6a3e");
    p.rect(2, 2, 12, 12, "#b88d5a");
    p.rect(3, 3, 10, 10, "#c9a26f");
  },
  path_top: (p) => {
    p.noise(["#9c7f4a", "#a88a52", "#8f7342", "#b09359"]);
    p.speckle(6, ["#7d6338"]);
  },
  destroy_0: (p) => cracks(p, 0),
  destroy_1: (p) => cracks(p, 1),
  destroy_2: (p) => cracks(p, 2),
  destroy_3: (p) => cracks(p, 3),
  destroy_4: (p) => cracks(p, 4),
  destroy_5: (p) => cracks(p, 5),
  destroy_6: (p) => cracks(p, 6),
  destroy_7: (p) => cracks(p, 7),
  destroy_8: (p) => cracks(p, 8),
  destroy_9: (p) => cracks(p, 9),
};

/** Paints the atlas once per page load. */
export function createAtlasCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_PX;
  canvas.height = ATLAS_PX;
  const ctx = canvas.getContext("2d")!;
  TILES.forEach((name, i) => {
    const img = ctx.createImageData(TILE_PX, TILE_PX);
    const pen = new Pen(img, 1000 + i * 7919);
    PAINTERS[name](pen);
    ctx.putImageData(img, (i % ATLAS_TILES_PER_ROW) * TILE_PX, Math.floor(i / ATLAS_TILES_PER_ROW) * TILE_PX);
  });
  return canvas;
}

let sharedCanvas: HTMLCanvasElement | null = null;
let sharedTexture: THREE.CanvasTexture | null = null;

export function getAtlasCanvas(): HTMLCanvasElement {
  return (sharedCanvas ??= createAtlasCanvas());
}

export function getAtlasTexture(): THREE.CanvasTexture {
  return (sharedTexture ??= createAtlasTexture(getAtlasCanvas()));
}

const avgCache = new Map<number, THREE.Color>();
/** Average opaque colour of a tile (for break particles). */
export function tileAverageColor(index: number): THREE.Color {
  const hit = avgCache.get(index);
  if (hit) return hit;
  const ctx = getAtlasCanvas().getContext("2d")!;
  const d = ctx.getImageData((index % ATLAS_TILES_PER_ROW) * TILE_PX, Math.floor(index / ATLAS_TILES_PER_ROW) * TILE_PX, TILE_PX, TILE_PX).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4)
    if (d[i + 3] > 128) {
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
      n++;
    }
  const c = new THREE.Color().setRGB(r / Math.max(n, 1) / 255, g / Math.max(n, 1) / 255, b / Math.max(n, 1) / 255, THREE.SRGBColorSpace);
  avgCache.set(index, c);
  return c;
}

export function createAtlasTexture(canvas = createAtlasCanvas()): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
