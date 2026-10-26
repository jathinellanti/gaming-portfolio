import { describe, it, expect } from "vitest";
import { formatLogLines } from "../../tools/vite-dev-log";

describe("formatLogLines", () => {
  it("formats an array of entries as JSON lines", () => {
    const out = formatLogLines([{ level: "info", event: "boot" }, { level: "warn", event: "x" }]);
    expect(out).toBe('{"level":"info","event":"boot"}\n{"level":"warn","event":"x"}\n');
  });
  it("rejects non-arrays", () => {
    expect(formatLogLines({ level: "info" })).toBeNull();
    expect(formatLogLines("boom")).toBeNull();
    expect(formatLogLines(null)).toBeNull();
  });
  it("rejects arrays containing non-objects", () => {
    expect(formatLogLines([1, 2])).toBeNull();
    expect(formatLogLines([{ a: 1 }, [1]])).toBeNull();
  });
  it("accepts an empty array as no output", () => {
    expect(formatLogLines([])).toBe("");
  });
});
