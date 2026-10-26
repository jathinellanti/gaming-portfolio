import { log } from "./log";
import { raise } from "./faults";

// Uncaught errors go to the one log; a stale lazy chunk after a redeploy is a
// known fault with a known fix (reload), so it is raised as such.
export function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to fetch dynamically/i.test(msg);
}

let installed = false;

export function installGlobalErrorLogging(): void {
  if (installed) return;
  installed = true;
  window.addEventListener("error", (e) => {
    log("error", "uncaught", { message: e.message, source: e.filename, line: e.lineno });
  });
  window.addEventListener("unhandledrejection", (e) => {
    log("error", "unhandled-rejection", { reason: String(e.reason) });
  });
  window.addEventListener("vite:preloadError", (e) => {
    raise("chunk.load_failed", { reason: String((e as Event & { payload?: unknown }).payload) });
  });
}
