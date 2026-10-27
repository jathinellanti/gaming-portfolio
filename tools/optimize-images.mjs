// Turn large source images into responsive WebP variants.
// Usage: node tools/optimize-images.mjs <srcDir> <outDir> [widths=960,1600,2400]
// Example: node tools/optimize-images.mjs art/hero public/hero
import sharp from "sharp";
import { mkdirSync, readdirSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const [srcDir, outDir, widthsArg] = process.argv.slice(2);
if (!srcDir || !outDir) {
  console.error("Usage: node tools/optimize-images.mjs <srcDir> <outDir> [widths]");
  process.exit(1);
}
const widths = (widthsArg ?? "960,1600,2400").split(",").map(Number).filter((n) => n > 0);
mkdirSync(resolve(outDir), { recursive: true });
for (const file of readdirSync(resolve(srcDir))) {
  if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
  const name = basename(file, extname(file));
  for (const w of widths) {
    const out = join(resolve(outDir), `${name}-${w}.webp`);
    const info = await sharp(join(resolve(srcDir), file)).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toFile(out);
    console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
}
