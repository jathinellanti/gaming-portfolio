import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

const WIDTHS = [360, 768, 1280, 1920] as const;
const THEMES = ["dark", "light"] as const;

async function setTheme(page: Page, theme: (typeof THEMES)[number]) {
  await page.addInitScript((t) => {
    localStorage.setItem("jp.settings.v1", JSON.stringify({ v: 2, data: { theme: t, sound: false, music: true, quality: "auto", lite: false, welcomeDismissed: false } }));
  }, theme);
}

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    test(`home renders without horizontal scroll at ${width}px (${theme})`, async ({ page }) => {
      await setTheme(page, theme);
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      // Every section is present and has real size.
      for (const id of ["about", "education", "experience", "skills", "projects", "certifications", "contact"]) {
        const box = await page.locator(`#${id}`).boundingBox();
        expect(box?.height ?? 0, id).toBeGreaterThan(100);
        // Sections fill the viewport up to the 1200px content cap; Certifications is a
        // side panel beside Education from 1024px up.
        const min = id === "certifications" && width >= 1024 ? 280 : Math.min(width, 1200) * 0.85;
        expect(box?.width ?? 0, id).toBeGreaterThan(min);
      }
      await page.screenshot({ path: `test-results/shots/home-${width}-${theme}.png` });
    });
  }
}

test("phone-width controls are at least 44px tall where they are primary actions", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  for (const name of [/view my cv/i, /explore my projects/i]) {
    const box = await page.getByRole("link", { name }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  const realm = await page.getByRole("button", { name: /enter the developer's realm/i }).first().boundingBox();
  expect(realm!.height).toBeGreaterThanOrEqual(44);
});

test("keyboard: skip link first, focus is always visible", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /skip to content/i })).toBeFocused();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    const visible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return false;
      const cs = getComputedStyle(el);
      return cs.outlineStyle !== "none" || cs.boxShadow !== "none";
    });
    expect(visible, `focus ring on tab stop ${i + 2}`).toBe(true);
  }
});

test("Ctrl+K palette jumps to a section", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: /jump to/i });
  await expect(dialog).toBeVisible();
  await page.keyboard.type("contact");
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/#contact$/);
});

test("mobile menu opens, traps focus and closes on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /open menu/i });
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: /menu/i });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Projects" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("CV: without a PDF in the build, the site offers the CV page instead", async ({ page, request }) => {
  const pdf = await request.get("/cv/Ellanti_Jathin_CV.pdf");
  const isPdf = pdf.ok() && (pdf.headers()["content-type"] ?? "").includes("pdf");
  await page.goto("/");
  if (isPdf) {
    await expect(page.getByRole("link", { name: /download cv/i }).first()).toHaveAttribute("href", "/cv/Ellanti_Jathin_CV.pdf");
  } else {
    await expect(page.getByRole("link", { name: /^view cv$/i }).first()).toHaveAttribute("href", "/cv");
    await expect(page.getByRole("link", { name: /download cv/i })).toHaveCount(0);
  }
});

test("CV page and print styles", async ({ page }) => {
  await page.goto("/cv");
  await expect(page.getByRole("article").getByRole("heading", { level: 1, name: "Ellanti Jathin" })).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("navigation", { name: /primary/i })).toBeHidden();
  await page.screenshot({ path: "test-results/shots/cv-print.png", fullPage: true });
});

test("project pages and unknown slugs", async ({ page }) => {
  await page.goto("/projects/weather-information-system");
  await expect(page.getByRole("heading", { level: 1, name: "Weather Information System" })).toBeVisible();
  await expect(page).toHaveTitle("Weather Information System · Ellanti Jathin");
  await page.goto("/projects/employee-leave-management");
  await expect(page.getByText("Team project. Individual contribution details coming soon.")).toBeVisible();
  await page.goto("/projects/nope");
  await expect(page.getByRole("heading", { name: "Project not found" })).toBeVisible();
  await page.goto("/totally/unknown");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("deep link to a section scrolls it into view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#skills");
  await expect(page.locator("#skills")).toBeInViewport();
});

test("reduced motion: the Realm entry navigates without the transition overlay", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // Record whether the overlay (its "Entering the Developer's Realm" caption) ever mounts.
  // A wall-clock bound was flaky under parallel software-WebGL load; this checks the behaviour.
  await page.evaluate(() => {
    (window as unknown as { sawOverlay: boolean }).sawOverlay = false;
    new MutationObserver(() => {
      if (document.body.textContent?.includes("Entering the Developer's Realm")) (window as unknown as { sawOverlay: boolean }).sawOverlay = true;
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  await page.getByRole("button", { name: /enter the developer's realm/i }).first().click();
  await expect(page).toHaveURL(/\/play$/);
  await expect(page.getByRole("heading", { name: /choose your world/i })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { sawOverlay: boolean }).sawOverlay)).toBe(false);
});

test("animated Realm entry shows the transition, then reaches World Select", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /enter the developer's realm/i }).first().click();
  await expect(page.getByText("Entering the Developer's Realm")).toBeVisible();
  await expect(page).toHaveURL(/\/play$/, { timeout: 3000 });
});

test("no console errors on the main routes except the expected cv.missing fault", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("fault:cv.missing")) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  for (const path of ["/", "/cv", "/projects/weather-information-system", "/play"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(errors).toEqual([]);
});
