import { test, expect } from "./fixtures";

// SUNSET BAY against the production build (software WebGL in headless Chromium).
test.describe.configure({ mode: "serial", timeout: 60_000 });
test.use({ trace: { mode: "retain-on-failure", screenshots: false, snapshots: { dom: true, screen: false } } });

test("boots with the HUD and the way out, gets into the red car, drives, and opens the phone", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("fault:cv.missing")) errors.push(m.text());
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => localStorage.removeItem("jp.city.v1"));
  await page.goto("/play/city");
  await expect(page.locator(".ct-root canvas").first()).toBeVisible({ timeout: 30_000 }); // the 3D view (the minimap is a canvas too)
  await expect(page.getByText("Loading the coast…")).toBeHidden({ timeout: 60_000 });
  const bar = page.getByRole("navigation", { name: /leave the realm/i });
  await expect(bar.getByRole("link", { name: /exit to professional portfolio/i })).toBeInViewport();
  await expect(page.getByText("Press F to get in the car.")).toBeVisible({ timeout: 10_000 });

  await page.keyboard.press("KeyF");
  await page.keyboard.down("KeyW");
  await expect(page.locator(".ct-speed")).toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(1500);
  await page.keyboard.up("KeyW");
  const kmh = Number((await page.locator(".ct-speed").textContent())?.replace(/\D/g, ""));
  expect(kmh).toBeGreaterThan(10);

  await page.keyboard.press("ArrowUp");
  const phone = page.getByRole("dialog", { name: "Phone" });
  await expect(phone).toBeVisible();
  await expect(phone.getByRole("link", { name: "CV" })).toHaveAttribute("href", "/cv");
  await page.keyboard.press("ArrowUp");
  await expect(phone).toBeHidden();
  expect(errors).toEqual([]);
});

test("Esc opens a menu with every CV section as a mission card", async ({ page }) => {
  await page.goto("/play/city");
  await expect(page.getByText("Loading the coast…")).toBeHidden({ timeout: 60_000 });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Paused" })).toBeVisible();
  await page.getByRole("button", { name: "Weather Plaza" }).click();
  const card = page.getByRole("dialog", { name: "Forecast Run" });
  await expect(card).toContainText("Weather Information System");
  await card.getByRole("button", { name: /complete mission/i }).click();
  await expect(page.getByText("Mission passed")).toBeVisible();
  await expect(page.locator(".ct-count strong")).toHaveText("1 / 7");
});
