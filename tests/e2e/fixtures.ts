import { test as base, expect } from "@playwright/test";

// Every e2e test starts past the monogram intro (it shows once per session on "/").
// intro.spec.ts imports @playwright/test directly to test the intro itself.
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => sessionStorage.setItem("jp.intro.v1", "seen"));
    await provide(page);
  },
});

export { expect };
