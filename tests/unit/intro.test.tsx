import { describe, it, expect, afterEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAt } from "./render";
import { INTRO_KEY, useIntro } from "../../src/site/intro";

// The store decides at module load; these re-import it fresh to test that decision.
async function freshIntroOpen() {
  vi.resetModules();
  const mod = await import("../../src/site/intro");
  return mod.useIntro.getState().open;
}

describe("monogram intro", () => {
  afterEach(() => {
    sessionStorage.setItem(INTRO_KEY, "seen");
    window.history.replaceState(null, "", "/");
    vi.restoreAllMocks();
    useIntro.setState({ open: false });
  });

  it("shows on a first visit to the home page, and only there", async () => {
    sessionStorage.removeItem(INTRO_KEY);
    window.history.replaceState(null, "", "/");
    expect(await freshIntroOpen()).toBe(true);
    window.history.replaceState(null, "", "/#projects");
    expect(await freshIntroOpen()).toBe(false); // deep links go straight to the section
    window.history.replaceState(null, "", "/cv");
    expect(await freshIntroOpen()).toBe(false);
  });

  it("is skipped once seen this session, and never shown when storage is blocked", async () => {
    window.history.replaceState(null, "", "/");
    sessionStorage.setItem(INTRO_KEY, "seen");
    expect(await freshIntroOpen()).toBe(false);
    sessionStorage.removeItem(INTRO_KEY);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(await freshIntroOpen()).toBe(false);
  });

  it("shows the monogram and enters the portfolio on click, remembering it", async () => {
    sessionStorage.removeItem(INTRO_KEY);
    useIntro.setState({ open: true });
    renderAt("/");
    const dialog = await screen.findByRole("dialog", { name: /Ellanti Jathin: portfolio/ });
    expect(screen.getByRole("img", { name: "Ellanti Jathin monogram" })).toBeInTheDocument();
    expect(document.documentElement.style.overflow).toBe("hidden");
    await userEvent.click(screen.getByRole("button", { name: /click to enter/i }));
    expect(useIntro.getState().open).toBe(false);
    expect(sessionStorage.getItem(INTRO_KEY)).toBe("seen");
    await waitFor(() => expect(dialog).not.toBeInTheDocument(), { timeout: 2000 });
    expect(document.documentElement.style.overflow).toBe("");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ellanti Jathin");
  });

  it("Escape also enters", async () => {
    useIntro.setState({ open: true });
    renderAt("/");
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(useIntro.getState().open).toBe(false);
  });
});
