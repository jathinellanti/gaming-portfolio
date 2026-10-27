import { describe, it, expect, vi } from "vitest";
import { FAULTS, raise, onFault } from "../../src/platform/faults";
import { getLogEntries, clearLog } from "../../src/platform/log";

describe("fault registry", () => {
  it("every fault has what/why/action, and action is concrete", () => {
    for (const [id, f] of Object.entries(FAULTS)) {
      expect(f.what.length, id).toBeGreaterThan(8);
      expect(f.why.length, id).toBeGreaterThan(8);
      expect(f.action.length, id).toBeGreaterThan(8);
      expect(f.action.toLowerCase(), id).not.toMatch(/investigate|contact support|try again later/);
    }
  });

  it("contains every id the spec registers", () => {
    expect(Object.keys(FAULTS).sort()).toEqual([
      "asset.load_failed",
      "audio.blocked",
      "audio.unsupported",
      "chunk.load_failed",
      "content.invalid",
      "cv.missing",
      "save.corrupt",
      "storage.unavailable",
      "webgl.context_lost",
      "webgl.unsupported",
      "worker.failed",
    ]);
  });

  it("raise() logs at error level and notifies listeners", () => {
    clearLog();
    const spy = vi.fn();
    const off = onFault(spy);
    const f = raise("cv.missing", { path: "/cv/x.pdf" });
    off();
    expect(f.id).toBe("cv.missing");
    expect(f.context).toEqual({ path: "/cv/x.pdf" });
    expect(spy).toHaveBeenCalledWith(f);
    const last = getLogEntries().at(-1)!;
    expect(last.level).toBe("error");
    expect(last.event).toBe("fault:cv.missing");
  });

  it("a listener that throws does not break raise() or other listeners", () => {
    const other = vi.fn();
    const off1 = onFault(() => {
      throw new Error("bad listener");
    });
    const off2 = onFault(other);
    expect(() => raise("audio.blocked")).not.toThrow();
    expect(other).toHaveBeenCalledOnce();
    off1();
    off2();
  });

  it("unsubscribed listeners are not called", () => {
    const spy = vi.fn();
    const off = onFault(spy);
    off();
    raise("audio.blocked");
    expect(spy).not.toHaveBeenCalled();
  });
});
