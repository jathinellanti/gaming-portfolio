import { defineConfig, devices } from "@playwright/test";

const PORT = 4317;
// An explicit IPv4 address: "localhost" resolves to ::1 for Node (where vite binds)
// but headless Chromium on Windows sometimes tries 127.0.0.1 only and is refused.
const HOST = "127.0.0.1";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run preview",
    url: `http://${HOST}:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
