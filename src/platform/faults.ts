import { log } from "./log";

// Every failure the app can surface. Each one says what happened (visitor terms),
// why (mechanism) and what to do (a concrete action naming a control or file).
// FaultId is a union of these keys, so raising an unregistered id fails `tsc`.
export interface FaultInfo {
  what: string;
  why: string;
  action: string;
}

export const FAULTS = {
  "webgl.unsupported": {
    what: "This device can't run the 3D worlds.",
    why: "The browser could not create a WebGL2 graphics context.",
    action: "You were returned to the professional site; the full CV is available there and via the CV button.",
  },
  "webgl.context_lost": {
    what: "Graphics were interrupted.",
    why: "The GPU reset or the tab ran low on graphics memory.",
    action: "Press 'Restore graphics', or open Settings and switch on Lite mode.",
  },
  "asset.load_failed": {
    what: "Some 3D models didn't load.",
    why: "A model or texture request failed (network error or missing file).",
    action:
      "A built-in stand-in is shown. Developer: check the file exists under public/assets/<game>/ and is listed in public/assets/LICENSES.md.",
  },
  "chunk.load_failed": {
    what: "The game files are out of date.",
    why: "The site was updated while this tab was open, so an older file no longer exists.",
    action: "Press 'Reload' to load the latest version.",
  },
  "worker.failed": {
    what: "World building slowed down.",
    why: "The background terrain builder stopped responding.",
    action: "Building continues on the main thread. Lower 'Render distance' in Settings if it stutters.",
  },
  "storage.unavailable": {
    what: "Progress and preferences won't be saved.",
    why: "This browser is blocking site storage (often private browsing).",
    action: "Keep playing normally; allow site data for this site to keep progress next time.",
  },
  "save.corrupt": {
    what: "Saved progress was reset.",
    why: "The saved data was from an older version or was damaged.",
    action: "Nothing to do: a fresh save was created automatically.",
  },
  "audio.blocked": {
    what: "Sound needs a click to start.",
    why: "Browsers block audio until you interact with the page.",
    action: "Press the sound toggle (speaker icon) to start audio.",
  },
  "cv.missing": {
    what: "The PDF CV is unavailable.",
    why: "The file public/cv/Ellanti_Jathin_CV.pdf is missing from this build.",
    action: "Use the 'View CV' page instead. Developer: add the PDF at public/cv/Ellanti_Jathin_CV.pdf and redeploy.",
  },
  "content.invalid": {
    what: "Portfolio content failed validation.",
    why: "An entry in src/content/data/ breaks the content schema.",
    action: "Open the file and field named in the error details and correct it, then run npm test.",
  },
} as const satisfies Record<string, FaultInfo>;

export type FaultId = keyof typeof FAULTS;
export type RaisedFault = FaultInfo & { id: FaultId; at: string; context?: Record<string, unknown> };
type Listener = (f: RaisedFault) => void;

const listeners = new Set<Listener>();

export function onFault(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function raise(id: FaultId, context?: Record<string, unknown>): RaisedFault {
  const fault: RaisedFault = { id, at: new Date().toISOString(), ...FAULTS[id], ...(context ? { context } : {}) };
  log("error", `fault:${id}`, { ...FAULTS[id], ...(context ?? {}) });
  for (const l of listeners) {
    try {
      l(fault);
    } catch (err) {
      log("error", "fault-listener-threw", { id, err: String(err) });
    }
  }
  return fault;
}
