import { test, expect, type Page } from "@playwright/test";

// Block World e2e against the production build (software WebGL in headless Chromium).
test.describe.configure({ mode: "serial" });

async function boot(page: Page, width = 1280, height = 800) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("fault:cv.missing")) errors.push(m.text());
  });
  await page.setViewportSize({ width, height });
  await page.addInitScript(() => localStorage.removeItem("jp.block.v1"));
  await page.goto("/play/block");
  await expect(page.locator(".jc canvas")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Building terrain…")).toBeHidden({ timeout: 60_000 });
  return errors;
}

async function openFromMenu(page: Page, button: string) {
  // With no screen open (and no pointer lock in automation), one Escape opens the menu.
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("Escape");
  const menu = page.getByRole("heading", { name: "Game Menu" });
  await expect(menu).toBeVisible();
  await page.getByRole("button", { name: button, exact: true }).click();
}

test("boots, renders the world and keeps CV/Exit on screen", async ({ page }) => {
  const errors = await boot(page);
  await page.waitForTimeout(1500);
  const shot = await page.screenshot({ path: "test-results/shots/block-1280.png" });
  // A uniform frame compresses to a few KB; a rendered voxel world is far larger.
  expect(shot.byteLength).toBeGreaterThan(80_000);
  const bar = page.getByRole("navigation", { name: /leave the realm/i });
  await expect(bar.getByRole("link", { name: "CV" })).toBeVisible();
  await expect(bar.getByRole("link", { name: /exit to professional portfolio/i })).toBeVisible();
  await expect(page.getByText("Click to play")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the game menu opens every CV section without playing", async ({ page }) => {
  const errors = await boot(page);
  const sections: [string, RegExp][] = [
    ["Armory", /The Armory: Skills/],
    ["Projects", /Crafting Hall: Projects/],
    ["Skill Tree", /Advancements: Skill Tree/],
    ["Achievements", /Hall of Trophies/],
    ["Boss Encounters", /The Dungeon: Boss Encounters/],
    ["Map & Fast Travel", /Map & Fast Travel/],
    ["Contact", /The Exit Gate/],
  ];
  for (const [button, heading] of sections) {
    await openFromMenu(page, button);
    await expect(page.getByRole("dialog", { name: heading })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: heading })).toBeHidden();
  }
  await openFromMenu(page, "The Archive");
  const book = page.getByRole("dialog", { name: /Book and Quill/ });
  await expect(book).toContainText("Ellanti Jathin");
  await book.getByRole("button", { name: "Next pages" }).click();
  await expect(book).toContainText("Drone Entry"); // spread 2: the rest of the bio
  await book.getByRole("button", { name: "Next pages" }).click();
  await expect(book).toContainText("CGPA: 9.02"); // spread 3: education
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});

test("real CV content appears inside the game screens", async ({ page }) => {
  await boot(page);
  await openFromMenu(page, "Projects");
  const crafting = page.getByRole("dialog", { name: /Crafting Hall/ });
  await expect(crafting).toContainText("Weather Information System");
  await crafting.getByRole("button", { name: /Employee Leave/ }).click();
  await expect(crafting).toContainText("Role-based dashboards for Admin, HR and Employee");
  await expect(crafting.getByRole("link", { name: "Read the case study" })).toHaveAttribute("href", "/projects/employee-leave-management");
  await page.keyboard.press("Escape");

  await openFromMenu(page, "Achievements");
  await expect(page.getByRole("dialog", { name: /Hall of Trophies/ })).toContainText("Unity Certified User: Programmer");
  await page.keyboard.press("Escape");

  await openFromMenu(page, "Boss Encounters");
  await expect(page.getByRole("dialog", { name: /Dungeon/ })).toContainText("The arena awaits its first challenger");
  await page.keyboard.press("Escape");
});

test("chat commands teleport and the map lists every place", async ({ page }) => {
  const errors = await boot(page);
  await page.keyboard.press("KeyT");
  await page.keyboard.type("/tp archive");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Teleporting to The Archive").first()).toBeVisible();
  await page.keyboard.press("KeyM");
  const map = page.getByRole("dialog", { name: /Map & Fast Travel/ });
  await expect(map.getByRole("button", { name: "Travel", exact: true })).toHaveCount(8);
  await map.getByRole("button", { name: "Open The Exit Gate without travelling" }).click();
  await expect(page.getByRole("dialog", { name: /The Exit Gate/ })).toContainText("jathinellanti@gmail.com");
  await page.getByRole("button", { name: "Return to Professional Portfolio" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(errors).toEqual([]);
});

test("phone width: touch-free layout still offers the menu and the way out", async ({ page }) => {
  await boot(page, 360, 780);
  await page.waitForTimeout(800);
  await page.screenshot({ path: "test-results/shots/block-360.png" });
  await expect(page.getByRole("link", { name: /exit to professional portfolio/i })).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Game Menu" })).toBeVisible();
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);
  await page.keyboard.press("Escape");
  const hotbar = await page.locator(".jc-hotbar").boundingBox();
  expect(hotbar!.x).toBeGreaterThanOrEqual(0);
  expect(hotbar!.x + hotbar!.width).toBeLessThanOrEqual(360);
});
