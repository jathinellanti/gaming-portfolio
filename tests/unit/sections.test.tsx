import { describe, it, expect, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAt, realContent } from "./render";

const section = async (id: string) => {
  await screen.findByRole("heading", { level: 1 });
  return document.getElementById(id) as HTMLElement;
};

describe("education", () => {
  it("lists entries newest first with results and ranges", async () => {
    renderAt("/");
    const s = await section("education");
    const titles = within(s).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(["B.Tech, Computer Science and Engineering", "Intermediate (BiPC)", "SSC (CBSE)"]);
    expect(s).toHaveTextContent("CGPA 9.02");
    expect(s).toHaveTextContent("89%");
    expect(s).toHaveTextContent("91%");
    expect(s).toHaveTextContent("Jul 2022 – May 2026");
  });
});

describe("experience", () => {
  it("shows the internship with a single-month date", async () => {
    renderAt("/");
    const s = await section("experience");
    expect(s).toHaveTextContent("Intern · Drone Entry");
    expect(s).toHaveTextContent("Bangkok, Thailand");
    expect(s).toHaveTextContent("Jul 2024");
    expect(s).not.toHaveTextContent("Jul 2024 – Jul 2024");
  });

  it("shows an explanatory empty state when there is no experience", async () => {
    const c = realContent();
    c.experience = [];
    renderAt("/", c);
    const s = await section("experience");
    expect(within(s).getByRole("status")).toHaveTextContent(/No experience listed yet/);
  });
});

describe("skills", () => {
  it("groups skills under category labels without proficiency meters", async () => {
    renderAt("/");
    const s = await section("skills");
    for (const label of ["Programming Languages", "Libraries & Frameworks", "Game Engines", "Databases", "Tools & Platforms"]) {
      expect(within(s).getByRole("heading", { name: label })).toBeInTheDocument();
    }
    expect(within(s).queryByRole("progressbar")).toBeNull();
    expect(within(s).queryByRole("meter")).toBeNull();
  });

  it("links an evidenced skill to its project and leaves others plain", async () => {
    renderAt("/");
    const s = await section("skills");
    expect(within(s).getByRole("link", { name: /^Django, evidence: Weather Information System$/ })).toHaveAttribute("href", "/projects/weather-information-system");
    expect(within(s).getByRole("link", { name: /^Unity, evidence/ })).toHaveAttribute("href", "/#certifications");
    expect(within(s).queryByRole("link", { name: /^Java,/ })).toBeNull();
    expect(within(s).getByText("Java")).toBeInTheDocument();
  });

  it("drops empty categories", async () => {
    const c = realContent();
    c.skills = c.skills.filter((x) => x.category === "languages");
    renderAt("/", c);
    const s = await section("skills");
    expect(within(s).getAllByRole("article")).toHaveLength(1);
  });
});

describe("projects", () => {
  it("renders a row per project linking to its page, with honest context", async () => {
    renderAt("/");
    const s = await section("projects");
    expect(within(s).getByRole("link", { name: "Weather Information System" })).toHaveAttribute("href", "/projects/weather-information-system");
    expect(within(s).getByRole("link", { name: "Employee Leave Management System" })).toHaveAttribute("href", "/projects/employee-leave-management");
    expect(s).toHaveTextContent("Team project (academic)");
    expect(s).toHaveTextContent("Screenshots coming soon");
    expect(within(s).queryAllByRole("img")).toHaveLength(0);
  });

  it("source links open GitHub safely in a new tab", async () => {
    renderAt("/");
    const s = await section("projects");
    for (const a of within(s).getAllByRole("link", { name: /source code/i })) {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a).toHaveAttribute("rel", "noopener noreferrer");
      expect(a.getAttribute("href")).toMatch(/^https:\/\/github\.com\/jathinellanti\//);
    }
  });

  it("shows an empty state when no projects exist", async () => {
    const c = realContent();
    c.projects = [];
    c.skills = c.skills.map((x) => ({ ...x, evidence: x.evidence.filter((e) => e.kind !== "project") }));
    renderAt("/", c);
    const s = await section("projects");
    expect(within(s).getByRole("status")).toHaveTextContent("No projects published yet");
  });
});

describe("certifications", () => {
  it("shows the exact certificate name and issuer, and no date when none is known", async () => {
    renderAt("/");
    const s = await section("certifications");
    expect(within(s).getByRole("heading", { name: "Unity Certified User: Programmer" })).toBeInTheDocument();
    expect(s).toHaveTextContent("Unity Technologies");
    expect(s.querySelector("time")).toBeNull();
  });

  it("shows an empty state when there are none", async () => {
    const c = realContent();
    c.achievements = [];
    c.skills = c.skills.map((x) => ({ ...x, evidence: x.evidence.filter((e) => e.kind !== "achievement") }));
    renderAt("/", c);
    const s = await section("certifications");
    expect(within(s).getByRole("status")).toHaveTextContent("No certifications listed yet");
  });
});

describe("contact", () => {
  it("offers mailto and GitHub; omits LinkedIn and CodeChef until URLs exist", async () => {
    renderAt("/");
    const s = await section("contact");
    expect(within(s).getByRole("link", { name: /send an email/i })).toHaveAttribute("href", "mailto:jathinellanti@gmail.com");
    expect(within(s).getByRole("link", { name: /github/i })).toHaveAttribute("href", "https://github.com/jathinellanti");
    expect(within(s).queryByRole("link", { name: /linkedin/i })).toBeNull();
    expect(within(s).queryByRole("link", { name: /codechef/i })).toBeNull();
    expect(s.querySelector('a[href="#"]')).toBeNull();
  });

  it("copies the email and announces it", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderAt("/");
    const s = await section("contact");
    await userEvent.click(within(s).getByRole("button", { name: /copy email address/i }));
    expect(writeText).toHaveBeenCalledWith("jathinellanti@gmail.com");
    await waitFor(() => expect(within(s).getByText("Email copied to clipboard")).toBeInTheDocument());
  });

  it("falls back to manual-copy guidance when the clipboard is refused", async () => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn(async () => Promise.reject(new Error("denied"))) }, configurable: true });
    renderAt("/");
    const s = await section("contact");
    await userEvent.click(within(s).getByRole("button", { name: /copy email address/i }));
    await waitFor(() => expect(within(s).getByText("Press Ctrl+C to copy")).toBeInTheDocument());
  });

  it("shows LinkedIn when a URL is added", async () => {
    const c = realContent();
    c.profile.links.linkedin = "https://www.linkedin.com/in/example";
    renderAt("/", c);
    const s = await section("contact");
    expect(within(s).getByRole("link", { name: /linkedin/i })).toHaveAttribute("href", "https://www.linkedin.com/in/example");
  });
});
