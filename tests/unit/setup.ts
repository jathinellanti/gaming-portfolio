import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { __resetCvProbe } from "../../src/site/useCv";
import { useSettings, DEFAULT_SETTINGS } from "../../src/platform/settings";

// jsdom gaps the app relies on in real browsers.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
if (typeof window.ResizeObserver !== "function") {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
window.scrollTo = (() => {}) as typeof window.scrollTo;
Element.prototype.scrollIntoView = function scrollIntoView() {};

beforeEach(() => {
  // Default: the CV PDF exists. Tests that need it missing override fetch.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 200, headers: { "content-type": "application/pdf" } })),
  );
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  __resetCvProbe();
  useSettings.setState(DEFAULT_SETTINGS);
  vi.unstubAllGlobals();
});
