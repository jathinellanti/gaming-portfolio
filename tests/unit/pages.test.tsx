import { describe, it, expect, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAt } from "./render";

describe("/cv", () => {
  it("renders the whole CV as one article", async () => {
    renderAt("/cv");
    const article = await screen.findByRole("article");
    expect(within(article).getByRole("heading", { level: 1, name: "Ellanti Jathin" })).toBeInTheDocument();
    for (const name of ["Profile", "Education", "Experience", "Skills", "Projects", "Certifications"]) {
      expect(within(article).getByRole("region", { name })).toBeInTheDocument();
    }
    expect(article).toHaveTextContent("jathinellanti@gmail.com");
    expect(article).toHaveTextContent("C#, Python, C, Java, JavaScript");
    expect(article).not.toHaveTextContent(/9182951536|VSN STREET/i);
  });

  it("prints on request and offers the PDF when present", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    renderAt("/cv");
    await userEvent.click(await screen.findByRole("button", { name: /print \/ save as pdf/i }));
    expect(print).toHaveBeenCalled();
    expect((await screen.findAllByRole("link", { name: /download cv/i }))[0]).toHaveAttribute("href", "/cv/Ellanti_Jathin_CV.pdf");
  });

  it("does not link the CV page to itself when the PDF is missing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
    renderAt("/cv");
    const article = await screen.findByRole("article");
    await waitFor(() => expect(screen.queryAllByRole("link", { name: /download cv/i })).toHaveLength(0));
    const toolbar = article.previousElementSibling as HTMLElement;
    expect(within(toolbar).queryByRole("link", { name: /view cv/i })).toBeNull();
  });
});

describe("/projects/:slug", () => {
  it("renders a project's full case study", async () => {
    renderAt("/projects/weather-information-system");
    expect(await screen.findByRole("heading", { level: 1, name: "Weather Information System" })).toBeInTheDocument();
    expect(screen.getByText(/requests current conditions and forecast data/)).toBeInTheDocument();
    expect(screen.getByText("City pages for Mumbai, Delhi, Bangalore and Kolkata")).toBeInTheDocument();
    const src = screen.getByRole("link", { name: /view source/i });
    expect(src).toHaveAttribute("href", "https://github.com/jathinellanti/Weatherapp");
    expect(src).toHaveAttribute("rel", "noopener noreferrer");
    await waitFor(() => expect(document.title).toBe("Weather Information System · Ellanti Jathin"));
  });

  it("shows the project's real screenshots in a captioned gallery; the cover is a labelled illustration", async () => {
    renderAt("/projects/weather-information-system");
    await screen.findByRole("heading", { level: 1 });
    const screens = screen.getByRole("region", { name: "Screens" });
    const figures = within(screens).getAllByRole("figure");
    expect(figures).toHaveLength(2);
    expect(within(figures[0]).getByRole("img")).toHaveAccessibleName(/Welcome to Weather Forecaster/);
    expect(figures[0]).toHaveTextContent("FIG 01");
    expect(figures[1]).toHaveTextContent("Forecast page: search any city, or jump to one of four");
    expect(screen.getByText("Illustration")).toBeInTheDocument();
  });

  it("a project without screenshots shows a labelled illustration and no Screens gallery", async () => {
    renderAt("/projects/employee-leave-management");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Illustration")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Screens" })).toBeNull();
  });

  it("claims nothing for a team project without a stated contribution", async () => {
    renderAt("/projects/employee-leave-management");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Team project. Individual contribution details coming soon.")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/jwt|nodemailer/i);
  });

  it("links to the next project", async () => {
    renderAt("/projects/weather-information-system");
    expect(await screen.findByRole("link", { name: /next project/i })).toHaveAttribute("href", "/projects/employee-leave-management");
  });

  it("shows a not-found page for an unknown slug", async () => {
    renderAt("/projects/unknown");
    expect(await screen.findByRole("heading", { name: "Project not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back home/i })).toHaveAttribute("href", "/");
  });
});
