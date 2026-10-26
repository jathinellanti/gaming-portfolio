import { describe, it, expect } from "vitest";
import { byNewest, formatMonth, formatRange } from "../../src/site/format";

describe("formatMonth", () => {
  it("formats first and last months of the year", () => {
    expect(formatMonth("2022-01")).toBe("Jan 2022");
    expect(formatMonth("2022-12")).toBe("Dec 2022");
  });
});

describe("formatRange", () => {
  it("collapses a same-month range to one month", () => {
    expect(formatRange("2024-07", "2024-07")).toBe("Jul 2024");
  });
  it("shows Present for an open end", () => {
    expect(formatRange("2022-07")).toBe("Jul 2022 – Present");
  });
  it("formats a normal range, including a Dec → Jan boundary", () => {
    expect(formatRange("2022-07", "2026-05")).toBe("Jul 2022 – May 2026");
    expect(formatRange("2023-12", "2024-01")).toBe("Dec 2023 – Jan 2024");
  });
});

describe("byNewest", () => {
  it("orders by start descending, open-ended first on ties", () => {
    const rows = [
      { start: "2019-07", end: "2020-04" },
      { start: "2022-07", end: "2026-05" },
      { start: "2022-07" },
      { start: "2020-07", end: "2022-06" },
    ];
    expect([...rows].sort(byNewest)).toEqual([{ start: "2022-07" }, { start: "2022-07", end: "2026-05" }, { start: "2020-07", end: "2022-06" }, { start: "2019-07", end: "2020-04" }]);
  });
});
