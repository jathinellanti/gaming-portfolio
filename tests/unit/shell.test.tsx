import { describe, it, expect, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAt } from "./render";
import * as faults from "../../src/platform/faults";

describe("app shell", () => {
  it("nav has every section link", async () => {
    renderAt("/");
    const nav = await screen.findByRole("navigation", { name: /primary/i });
    for (const label of ["About", "Education", "Experience", "Skills", "Projects", "Certifications", "Contact"]) {
      expect(within(nav).getByRole("link", { name: label })).toHaveAttribute("href", `/#${label.toLowerCase()}`);
    }
  });

  it("offers the PDF download when the CV file is a real PDF", async () => {
    renderAt("/");
    const links = await screen.findAllByRole("link", { name: /download cv/i });
    expect(links[0]).toHaveAttribute("href", "/cv/Ellanti_Jathin_CV.pdf");
    expect(links[0]).toHaveAttribute("download");
  });

  it("swaps to View CV and raises cv.missing once when the PDF is absent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 200, headers: { "content-type": "text/html" } })));
    const spy = vi.spyOn(faults, "raise");
    renderAt("/");
    await waitFor(() => expect(screen.queryAllByRole("link", { name: /download cv/i })).toHaveLength(0));
    expect(screen.getAllByRole("link", { name: /view cv/i }).some((l) => l.getAttribute("href") === "/cv")).toBe(true);
    expect(spy.mock.calls.filter(([id]) => id === "cv.missing")).toHaveLength(1);
    spy.mockRestore();
  });

  it("treats a network failure as a missing CV", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    renderAt("/");
    await waitFor(() => expect(screen.queryAllByRole("link", { name: /download cv/i })).toHaveLength(0));
  });

  it("theme toggle flips data-theme and relabels itself", async () => {
    renderAt("/");
    const btn = await screen.findByRole("button", { name: /switch to light theme/i });
    await userEvent.click(btn);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByRole("button", { name: /switch to dark theme/i })).toBeInTheDocument();
  });

  it("Ctrl+K opens the jump palette; choosing a project navigates", async () => {
    const { router } = renderAt("/");
    await screen.findByRole("navigation", { name: /primary/i });
    await userEvent.keyboard("{Control>}k{/Control}");
    const dialog = await screen.findByRole("dialog", { name: /jump to/i });
    await userEvent.click(within(dialog).getByText("Weather Information System"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/projects/weather-information-system"));
  });

  it("has a skip link to the main content", async () => {
    renderAt("/");
    expect(await screen.findByRole("link", { name: /skip to content/i })).toHaveAttribute("href", "#main");
    expect(document.getElementById("main")).toBeInTheDocument();
  });

  it("unknown route renders 404 with links home, CV and play", async () => {
    renderAt("/nope");
    expect(await screen.findByRole("heading", { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back home/i })).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: /view cv/i }).some((l) => l.getAttribute("href") === "/cv")).toBe(true);
    expect(screen.getByRole("link", { name: /developer's realm/i })).toHaveAttribute("href", "/play");
  });
});
