import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../../src/router";
import { ContentProvider } from "../../src/content/useContent";
import { rawContent } from "../../src/content/data";
import { validateContent, publicView, type Content } from "../../src/content/schema";

export function realContent(): Content {
  const r = validateContent(structuredClone(rawContent));
  if (!r.ok) throw new Error(r.issues.join("\n"));
  return publicView(r.content);
}

/** Render the real route table at `path`, with real (or overridden) content. */
export function renderAt(path: string, content: Content = realContent()) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(
    <ContentProvider content={content}>
      <RouterProvider router={router} />
    </ContentProvider>,
  );
  return { ...utils, router };
}
