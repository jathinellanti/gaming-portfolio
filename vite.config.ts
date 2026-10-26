import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { devLogPlugin } from "./tools/vite-dev-log.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), devLogPlugin()],
  // Hashed bundles go to /static (cached forever); /assets holds un-hashed game
  // assets and credits that must stay revalidatable.
  // The only large chunks are the lazy game bundles (three.js inside); first paint is
  // budgeted separately by tests/e2e/bundle.spec.ts.
  build: { manifest: true, target: "es2022", assetsDir: "static", chunkSizeWarningLimit: 1200 },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/unit/setup.ts"],
  },
});
