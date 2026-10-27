import { describe, it, expect } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAt } from "./render";
import { SLIDES } from "../../src/site/sections/HeroCarousel";
import { WORLDS } from "../../src/play/worlds";

describe("hero", () => {
  it("leads with name, title, certificate and intro", async () => {
    renderAt("/");
    const h1 = await screen.findByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Ellanti");
    expect(h1).toHaveTextContent("Jathin");
    const hero = within(h1.closest("section")!);
    expect(hero.getByText("Software Developer")).toBeInTheDocument();
    expect(hero.getByText("Unity Certified User: Programmer")).toBeInTheDocument();
    expect(hero.getByText(/CGPA 9\.02\)\. I build full-stack/)).toBeInTheDocument();
  });

  it("CTAs point to the CV page and the projects section", async () => {
    renderAt("/");
    expect(await screen.findByRole("link", { name: /view my cv/i })).toHaveAttribute("href", "/cv");
    expect(screen.getByRole("link", { name: /explore my projects/i })).toHaveAttribute("href", "#projects");
  });

  it("Enter the Developer's Realm navigates to /play", async () => {
    const { router } = renderAt("/");
    const hero = (await screen.findByRole("heading", { level: 1 })).closest("section")!;
    await userEvent.click(within(hero).getByRole("button", { name: /enter the developer's realm/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/play"), { timeout: 2000 });
  });

  it("the background carousel cycles Minecraft-style → GTA-style → Neon City, with tabs and a pause control", async () => {
    renderAt("/");
    const tabs = await screen.findByRole("tablist", { name: "Game worlds" });
    const items = within(tabs).getAllByRole("tab");
    expect(items.map((t) => t.getAttribute("aria-label"))).toEqual(SLIDES.map((s) => `Show ${s.name}`));
    expect(SLIDES.map((s) => s.id)).toEqual(["block", "city", "neon"]);
    expect(items[0]).toHaveAttribute("aria-selected", "true");
    await userEvent.click(items[2]);
    expect(items[2]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Neon City ·/)).toBeInTheDocument();
    const pause = screen.getByRole("button", { name: /pause slideshow|play slideshow/i });
    const before = pause.getAttribute("aria-label");
    await userEvent.click(pause);
    expect(screen.getByRole("button", { name: /pause slideshow|play slideshow/i }).getAttribute("aria-label")).not.toBe(before);
  });

  it("'Play' enters a playable world, or its World Select card while it is in development", async () => {
    const { router } = renderAt("/");
    const tabs = await screen.findByRole("tablist", { name: "Game worlds" });
    await userEvent.click(within(tabs).getAllByRole("tab")[0]);
    await userEvent.click(screen.getByRole("button", { name: /play block world/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/play/block"), { timeout: 2000 });
  });

  it("Open City's Play goes straight into the game", async () => {
    const { router } = renderAt("/");
    const tabs = await screen.findByRole("tablist", { name: "Game worlds" });
    await userEvent.click(within(tabs).getAllByRole("tab")[1]);
    await userEvent.click(screen.getByRole("button", { name: /play open city/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/play/city"), { timeout: 2000 });
  });

  it("a world still in development opens its card on World Select instead", async () => {
    const city = WORLDS.find((w) => w.id === "city")!;
    const status = city.status;
    city.status = "in-development";
    try {
      const { router } = renderAt("/");
      const tabs = await screen.findByRole("tablist", { name: "Game worlds" });
      await userEvent.click(within(tabs).getAllByRole("tab")[1]);
      await userEvent.click(screen.getByRole("button", { name: /play open city/i }));
      await waitFor(() => expect(router.state.location.hash).toBe("#city"), { timeout: 2000 });
      expect(router.state.location.pathname).toBe("/play");
    } finally {
      city.status = status;
    }
  });

  it("slide images are decorative (the art has no informational content)", async () => {
    renderAt("/");
    const hero = (await screen.findByRole("heading", { level: 1 })).closest("section")!;
    for (const img of hero.querySelectorAll("img")) expect(img).toHaveAttribute("alt", "");
  });
});
