import { test, expect } from "@playwright/test";

// The monogram intro (this file deliberately skips the fixture that pre-dismisses it).
test("first visit shows the monogram; a click enters the portfolio and it stays dismissed", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const intro = page.getByRole("dialog", { name: /portfolio/i });
  await expect(intro).toBeVisible();
  await expect(page.getByRole("img", { name: /monogram/i })).toBeVisible();
  const enter = page.getByRole("button", { name: /click to enter/i });
  await expect(enter).toBeVisible({ timeout: 5000 });
  await enter.click();
  await expect(intro).toBeHidden({ timeout: 3000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog", { name: /portfolio/i })).toHaveCount(0);
});

test("deep links skip the intro", async ({ page }) => {
  await page.goto("/#projects");
  await expect(page.locator("#projects")).toBeInViewport();
  await expect(page.getByRole("dialog", { name: /portfolio/i })).toHaveCount(0);
});

test("keyboard: the enter button has focus, and Enter opens the portfolio", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /click to enter/i })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: /portfolio/i })).toBeHidden({ timeout: 3000 });
});
