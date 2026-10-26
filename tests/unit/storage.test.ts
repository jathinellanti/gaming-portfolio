import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { versionedStore, __resetStorageFaultOnce } from "../../src/platform/storage";
import * as faults from "../../src/platform/faults";

const schema = z.object({ n: z.number() });

describe("versionedStore", () => {
  beforeEach(() => {
    localStorage.clear();
    __resetStorageFaultOnce();
    vi.restoreAllMocks();
  });

  it("returns fallback when empty, then round-trips", () => {
    const s = versionedStore("t", 1, (r) => schema.parse(r), { n: 0 });
    expect(s.load()).toEqual({ n: 0 });
    s.save({ n: 5 });
    expect(s.load()).toEqual({ n: 5 });
  });

  it("treats corrupt JSON as save.corrupt, returns fallback and overwrites", () => {
    const spy = vi.spyOn(faults, "raise");
    localStorage.setItem("t", "{not json");
    expect(versionedStore("t", 1, (r) => schema.parse(r), { n: 0 }).load()).toEqual({ n: 0 });
    expect(spy).toHaveBeenCalledWith("save.corrupt", expect.objectContaining({ key: "t" }));
    expect(JSON.parse(localStorage.getItem("t")!)).toEqual({ v: 1, data: { n: 0 } });
  });

  it("treats an old version as save.corrupt", () => {
    const spy = vi.spyOn(faults, "raise");
    localStorage.setItem("t", JSON.stringify({ v: 0, data: { n: 9 } }));
    expect(versionedStore("t", 1, (r) => schema.parse(r), { n: 0 }).load()).toEqual({ n: 0 });
    expect(spy).toHaveBeenCalledWith("save.corrupt", expect.anything());
  });

  it("treats schema mismatch as save.corrupt", () => {
    localStorage.setItem("t", JSON.stringify({ v: 1, data: { n: "x" } }));
    expect(versionedStore("t", 1, (r) => schema.parse(r), { n: 0 }).load()).toEqual({ n: 0 });
  });

  it("raises storage.unavailable once when storage throws, and never throws itself", () => {
    const spy = vi.spyOn(faults, "raise");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const s = versionedStore("t", 1, (r) => schema.parse(r), { n: 0 });
    expect(s.load()).toEqual({ n: 0 });
    expect(() => s.save({ n: 1 })).not.toThrow();
    s.load();
    expect(spy.mock.calls.filter(([id]) => id === "storage.unavailable")).toHaveLength(1);
  });
});
