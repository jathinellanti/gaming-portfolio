import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

// Invariant 6: the professional site's first paint ships no 3D engine.
// Runs after the webServer build, so dist/ is fresh.
type ManifestChunk = { file: string; isEntry?: boolean; imports?: string[] };

test("the entry chunk and its static imports contain no WebGL renderer", () => {
  const manifestPath = resolve("dist/.vite/manifest.json");
  expect(existsSync(manifestPath), "run npm run build first").toBe(true);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, ManifestChunk>;
  const entryKey = Object.keys(manifest).find((k) => manifest[k].isEntry);
  expect(entryKey).toBeTruthy();

  const seen = new Set<string>();
  const visit = (key: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    for (const dep of manifest[key].imports ?? []) visit(dep);
  };
  visit(entryKey!);

  let gzipBytes = 0;
  for (const key of seen) {
    const code = readFileSync(resolve("dist", manifest[key].file));
    gzipBytes += gzipSync(code).length;
    expect(code.toString("utf8"), manifest[key].file).not.toMatch(/WebGLRenderer|WEBGL_lose_context/);
  }
  // Spec §6 budget: first-paint JS ≤ 200 KB gzip (Phase 1 measured ~160 KB).
  expect(gzipBytes).toBeLessThanOrEqual(200 * 1024);
});
