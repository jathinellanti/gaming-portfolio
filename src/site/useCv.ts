import { useEffect, useState } from "react";
import { raise } from "../platform/faults";

// The CV PDF is optional in a build. Probe it once per page load: if it is not a
// real PDF (dev servers answer missing files with index.html), swap the download
// for the /cv page and raise cv.missing once.
export type CvState = "checking" | "available" | "missing";

let probe: Promise<boolean> | null = null;
let faultRaised = false;

export const __resetCvProbe = () => {
  probe = null;
  faultRaised = false;
};

export function probeCv(path: string): Promise<boolean> {
  probe ??= fetch(path, { method: "HEAD" })
    .then((r) => r.ok && (r.headers.get("content-type") ?? "").includes("pdf"))
    .catch(() => false)
    .then((ok) => {
      if (!ok && !faultRaised) {
        faultRaised = true;
        raise("cv.missing", { path });
      }
      return ok;
    });
  return probe;
}

export function useCvState(path: string): CvState {
  const [state, setState] = useState<CvState>("checking");
  useEffect(() => {
    let live = true;
    probeCv(path).then((ok) => live && setState(ok ? "available" : "missing"));
    return () => {
      live = false;
    };
  }, [path]);
  return state;
}
