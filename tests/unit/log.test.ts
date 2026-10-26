import { describe, it, expect, beforeEach, vi } from "vitest";
import { log, getLogEntries, getLogText, clearLog, LOG_CAPACITY } from "../../src/platform/log";

describe("log ring buffer", () => {
  beforeEach(() => {
    clearLog();
    vi.restoreAllMocks();
  });

  it("records entries with timestamps", () => {
    log("info", "boot", { a: 1 });
    const [e] = getLogEntries();
    expect(e).toMatchObject({ level: "info", event: "boot", data: { a: 1 } });
    expect(typeof e.at).toBe("string");
  });

  it("omits data when none is given", () => {
    log("info", "bare");
    expect(getLogEntries()[0]).not.toHaveProperty("data");
  });

  it("keeps only the last LOG_CAPACITY entries", () => {
    for (let i = 0; i < LOG_CAPACITY + 5; i++) log("debug", `e${i}`);
    const entries = getLogEntries();
    expect(entries).toHaveLength(LOG_CAPACITY);
    expect(entries[0].event).toBe("e5");
    expect(entries.at(-1)!.event).toBe(`e${LOG_CAPACITY + 4}`);
  });

  it("persists to localStorage under jp.log", () => {
    log("warn", "persisted");
    const stored = JSON.parse(localStorage.getItem("jp.log")!);
    expect(stored.at(-1).event).toBe("persisted");
  });

  it("survives localStorage throwing", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    expect(() => log("warn", "x")).not.toThrow();
    expect(getLogEntries().at(-1)!.event).toBe("x");
  });

  it("getLogText is one JSON line per entry, empty when no entries", () => {
    expect(getLogText()).toBe("");
    log("info", "a");
    log("info", "b");
    expect(getLogText().trim().split("\n")).toHaveLength(2);
  });
});
