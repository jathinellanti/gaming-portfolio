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

  it("migrates an older version when a migration is given, and saves the upgrade", () => {
    const spy = vi.spyOn(faults, "raise");
    localStorage.setItem("t", JSON.stringify({ v: 1, data: { n: 4 } }));
    const migrate = vi.fn((from: number, data: unknown) => ({ n: (data as { n: number }).n * 10 + from }));
    expect(versionedStore("t", 2, (r) => schema.parse(r), { n: 0 }, migrate).load()).toEqual({ n: 41 });
    expect(migrate).toHaveBeenCalledWith(1, { n: 4 });
    expect(JSON.parse(localStorage.getItem("t")!)).toEqual({ v: 2, data: { n: 41 } });
    expect(spy).not.toHaveBeenCalled();
  });

  it("a failing migration, or a newer stored version, still counts as save.corrupt", () => {
    const spy = vi.spyOn(faults, "raise");
    localStorage.setItem("t", JSON.stringify({ v: 1, data: { n: 4 } }));
    const failing = () => {
      throw new Error("no path");
    };
    expect(versionedStore("t", 2, (r) => schema.parse(r), { n: 0 }, failing).load()).toEqual({ n: 0 });
    localStorage.setItem("t", JSON.stringify({ v: 3, data: { n: 4 } }));
    expect(versionedStore("t", 2, (r) => schema.parse(r), { n: 0 }, () => ({ n: 7 })).load()).toEqual({ n: 0 });
    expect(spy).toHaveBeenCalledTimes(2);
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
