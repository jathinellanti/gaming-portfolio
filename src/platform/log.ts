// Single logger for the whole app. Dev: batches go to logs/app.log via the Vite
// middleware (tools/vite-dev-log.ts). Prod: in-memory ring buffer mirrored to
// localStorage["jp.log"], exportable via Settings → "Copy diagnostics".

export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogEntry {
  at: string;
  level: LogLevel;
  event: string;
  data?: Record<string, unknown>;
}

export const LOG_CAPACITY = 200;
const STORAGE_KEY = "jp.log";

let buffer: LogEntry[] = [];
let pending: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch {
    // Storage blocked or full: the in-memory buffer still holds the entries.
  }
}

function flushToDevServer() {
  flushTimer = null;
  if (pending.length === 0) return;
  const body = JSON.stringify(pending);
  pending = [];
  fetch("/__log", { method: "POST", body, headers: { "content-type": "application/json" } }).catch(() => {});
}

const isDevServer = import.meta.env.DEV && import.meta.env.MODE !== "test";

export function log(level: LogLevel, event: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = { at: new Date().toISOString(), level, event, ...(data ? { data } : {}) };
  buffer.push(entry);
  if (buffer.length > LOG_CAPACITY) buffer = buffer.slice(-LOG_CAPACITY);
  persist();
  if (isDevServer) {
    pending.push(entry);
    flushTimer ??= setTimeout(flushToDevServer, 250);
  }
  if (import.meta.env.MODE === "test") return;
  const sink =
    level === "error" ? console.error : level === "warn" ? console.warn : level === "info" ? console.info : console.debug;
  sink(`[${level}] ${event}`, data ?? "");
}

export const getLogEntries = (): LogEntry[] => [...buffer];

export const getLogText = (): string => buffer.map((e) => JSON.stringify(e) + "\n").join("");

export function clearLog(): void {
  buffer = [];
  persist();
}
