import { raise } from "./faults";

// Versioned, validated localStorage. Never throws: blocked storage raises
// storage.unavailable once per session; bad/old data raises save.corrupt and resets.
// `parse` must return a valid T or throw (a zod schema's `.parse` fits, as does a
// hand-written guard; the site uses the latter to keep zod off first paint).
let storageFaultRaised = false;
export const __resetStorageFaultOnce = () => {
  storageFaultRaised = false;
};

function storageFault(err: unknown) {
  if (storageFaultRaised) return;
  storageFaultRaised = true;
  raise("storage.unavailable", { err: String(err) });
}

export interface VersionedStore<T> {
  load(): T;
  save(value: T): void;
}

export function versionedStore<T>(key: string, version: number, parse: (raw: unknown) => T, fallback: T): VersionedStore<T> {
  const save = (value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify({ v: version, data: value }));
    } catch (err) {
      storageFault(err);
    }
  };
  const load = (): T => {
    let raw: string | null;
    try {
      raw = localStorage.getItem(key);
    } catch (err) {
      storageFault(err);
      return fallback;
    }
    if (raw === null) return fallback;
    try {
      const parsed = JSON.parse(raw) as { v?: unknown; data?: unknown };
      if (parsed.v !== version) throw new Error(`stored version ${String(parsed.v)} does not match ${version}`);
      return parse(parsed.data);
    } catch (err) {
      raise("save.corrupt", { key, err: String(err) });
      save(fallback);
      return fallback;
    }
  };
  return { load, save };
}
