import { describe, it, expect } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAt } from "./render";
import { POSTER_LABEL } from "../../src/site/art/HeroPoster";

describe("hero", () => {
  it("leads with name, title, certificate and intro", async () => {
    renderAt("/");
    const h1 = await screen.findByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Ellanti");
    expect(h1).toHaveTextContent("Jathin");
    expect(screen.getByText("Software Developer")).toBeInTheDocument();
    expect(screen.getAllByText("Unity Certified User: Programmer").length).toBeGreaterThan(0);
    expect(screen.getByText(/CGPA 9\.02\)\. I build full-stack/)).toBeInTheDocument();
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

  it("each world shortcut opens World Select at that world", async () => {
    const { router } = renderAt("/");
    await userEvent.click(await screen.findByRole("button", { name: /neon city/i }));
    await waitFor(() => expect(router.state.location.hash).toBe("#neon"), { timeout: 2000 });
  });

  it("the poster is a described image", async () => {
    renderAt("/");
    expect(await screen.findByRole("img", { name: POSTER_LABEL })).toBeInTheDocument();
  });
});
