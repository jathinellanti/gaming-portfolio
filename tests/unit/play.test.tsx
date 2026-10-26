import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAt } from "./render";
import { useSettings } from "../../src/platform/settings";
import { WORLDS } from "../../src/play/worlds";

describe("/play World Select", () => {
  it("shows three worlds with titles and pitches", async () => {
    renderAt("/play");
    const list = await screen.findByRole("list", { name: "Worlds" });
    const cards = within(list).getAllByRole("article");
    expect(cards).toHaveLength(3);
    expect(cards.map((c) => within(c).getByRole("heading", { level: 2 }).textContent)).toEqual(["JATHINCRAFT", "NEON//SPRAWL", "SUNSET BAY"]);
  });

  it("playable worlds link to their game; in-development worlds are visibly and accessibly disabled", async () => {
    const { router } = renderAt("/play");
    const list = await screen.findByRole("list", { name: "Worlds" });
    const cards = within(list).getAllByRole("article");
    for (const card of cards) {
      const id = card.id;
      const world = WORLDS.find((w) => w.id === id)!;
      if (world.status === "available") {
        expect(card).toHaveTextContent("Playable now");
        expect(within(card).getByRole("link", { name: `Play ${world.title}` })).toHaveAttribute("href", `/play/${id}`);
      } else {
        expect(card).toHaveTextContent("In development");
        const play = within(card).getByRole("button", { name: /play/i });
        expect(play).toHaveAttribute("aria-disabled", "true");
        await userEvent.click(play);
      }
    }
    expect(router.state.location.pathname).toBe("/play");
    expect(WORLDS.find((w) => w.id === "block")!.status).toBe("available");
  });

  it("arrow keys move focus between world cards, wrapping around", async () => {
    renderAt("/play");
    const list = await screen.findByRole("list", { name: "Worlds" });
    const cards = within(list).getAllByRole("article");
    cards[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(cards[1]).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(cards[2]).toHaveFocus();
  });

  it("a #world hash focuses that card", async () => {
    renderAt("/play#city");
    await screen.findByRole("list", { name: "Worlds" });
    expect(document.getElementById("city")).toHaveFocus();
  });

  it("always offers CV and Exit", async () => {
    renderAt("/play");
    const bar = await screen.findByRole("navigation", { name: /leave the realm/i });
    expect(within(bar).getByRole("link", { name: "CV" })).toHaveAttribute("href", "/cv");
    expect(within(bar).getByRole("link", { name: /exit to professional portfolio/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /open cv instead/i })).toHaveAttribute("href", "/cv");
  });

  it("the welcome note can be dismissed and stays dismissed", async () => {
    renderAt("/play");
    await userEvent.click(await screen.findByRole("button", { name: /dismiss note/i }));
    expect(screen.queryByRole("note")).toBeNull();
    expect(useSettings.getState().welcomeDismissed).toBe(true);
    expect(JSON.parse(localStorage.getItem("jp.settings.v1")!).data.welcomeDismissed).toBe(true);
  });
});
