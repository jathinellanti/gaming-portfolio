import { raise } from "./faults";

// Versioned, validated localStorage. Never throws: blocked storage raises
// storage.unavailable once per session; bad/old data raises save.corrupt and resets.
// `parse` must return a valid T or throw (a zod schema's `.parse` fits, as does a
// hand-written guard; the site uses the latter to keep zod off first paint).
// `migrate` upgrades data saved under an older version; without it (or if it
// throws), old data counts as corrupt and resets.
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

export function versionedStore<T>(
  key: string,
  version: number,
  parse: (raw: unknown) => T,
  fallback: T,
  migrate?: (fromVersion: number, data: unknown) => unknown,
): VersionedStore<T> {
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
      if (parsed.v === version) return parse(parsed.data);
      if (migrate && typeof parsed.v === "number" && parsed.v < version) {
        const upgraded = parse(migrate(parsed.v, parsed.data));
        save(upgraded);
        return upgraded;
      }
      throw new Error(`stored version ${String(parsed.v)} does not match ${version}`);
    } catch (err) {
      raise("save.corrupt", { key, err: String(err) });
      save(fallback);
      return fallback;
    }
  };
  return { load, save };
}
