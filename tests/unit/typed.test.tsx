import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import { TypedText } from "../../src/site/components/TypedText";

describe("TypedText", () => {
  afterEach(() => vi.useRealTimers());

  const typed = (c: HTMLElement) => c.querySelector("span.absolute")!.firstChild?.textContent ?? "";

  it("gives screen readers the whole text at once, and types nothing before it starts", () => {
    const { container, rerender } = render(<TypedText text="Ellanti Jathin" start={false} />);
    expect(container.querySelector(".sr-only")).toHaveTextContent("Ellanti Jathin");
    expect(typed(container)).toBe("");
    rerender(<TypedText text="Ellanti Jathin" start={false} />);
    expect(typed(container)).toBe("");
  });

  it("types one character at a time after the delay, then marks the caret done", () => {
    vi.useFakeTimers();
    const { container } = render(<TypedText text="EJ ok" start delay={300} speed={80} />);
    act(() => vi.advanceTimersByTime(299));
    expect(typed(container)).toBe("");
    act(() => vi.advanceTimersByTime(81));
    expect(typed(container)).toBe("E");
    act(() => vi.advanceTimersByTime(160));
    expect(typed(container)).toBe("EJ ");
    expect(container.querySelector(".type-caret")).not.toHaveClass("is-done");
    act(() => vi.advanceTimersByTime(400));
    expect(typed(container)).toBe("EJ ok");
    expect(container.querySelector(".type-caret")).toHaveClass("is-done");
  });

  it("reserves the full size with an invisible copy, so typing never reflows", () => {
    const { container } = render(<TypedText text="Ellanti Jathin" start={false} />);
    expect(container.querySelector(".invisible")).toHaveTextContent("Ellanti Jathin");
  });
});
