import { test, expect } from "./fixtures";

for (const width of [360, 768, 1280, 1920]) {
  test(`World Select at ${width}px: three cards, Exit/CV always visible, no horizontal scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/play");
    await expect(page.getByRole("list", { name: "Worlds" }).getByRole("article")).toHaveCount(3);
    const bar = page.getByRole("navigation", { name: /leave the realm/i });
    await expect(bar.getByRole("link", { name: "CV" })).toBeInViewport();
    await expect(bar.getByRole("link", { name: /exit to professional portfolio/i })).toBeInViewport();
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(sw).toBeLessThanOrEqual(cw);
    await page.screenshot({ path: `test-results/shots/play-${width}.png` });
  });
}

test("World Select keyboard navigation; every world links into its game", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/play#block");
  const cards = page.getByRole("list", { name: "Worlds" }).getByRole("article");
  await expect(cards.nth(0)).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(cards.nth(1)).toBeFocused();
  await expect(cards.nth(1).getByRole("link", { name: /play/i })).toHaveAttribute("href", "/play/neon");
  await page.keyboard.press("ArrowRight");
  await expect(cards.nth(2)).toBeFocused();
  await expect(cards.nth(2).getByRole("link", { name: /play/i })).toHaveAttribute("href", "/play/city");
});

test("Exit returns to the professional site", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("link", { name: /exit to professional portfolio/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ellanti");
});
