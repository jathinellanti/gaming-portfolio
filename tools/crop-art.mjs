// Cut character-card crops out of the original key art (art/hero/*.jpg) as WebP.
// Usage: node tools/crop-art.mjs
// Each crop is a fraction box of the source; outputs go to public/art/<name>-<w>.webp.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const CROPS = [
  // Portrait "character cards" for the worlds gallery (3:4).
  { src: "block-world", name: "block-tall", box: [0.38, 0, 0.42, 1], widths: [600, 900] },
  { src: "open-city", name: "city-tall", box: [0.56, 0, 0.42, 1], widths: [600, 900] },
  { src: "neon-city", name: "neon-tall", box: [0.5, 0, 0.42, 1], widths: [600, 900] },
];

mkdirSync("public/art", { recursive: true });
for (const c of CROPS) {
  const img = sharp(`art/hero/${c.src}.jpg`);
  const { width: W, height: H } = await img.metadata();
  const [x, y, w, h] = c.box;
  const region = { left: Math.round(x * W), top: Math.round(y * H), width: Math.round(w * W), height: Math.round(h * H) };
  for (const out of c.widths) {
    const file = `public/art/${c.name}-${out}.webp`;
    const info = await sharp(`art/hero/${c.src}.jpg`).extract(region).resize({ width: out, withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toFile(file);
    console.log(`${file}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
}
