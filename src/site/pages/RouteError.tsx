import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { isChunkLoadError } from "../../platform/globalErrors";
import { FAULTS, raise } from "../../platform/faults";
import { log } from "../../platform/log";

// Last-resort boundary. Plain markup on purpose: it must render even if the
// site layout itself is what failed.
export function RouteError() {
  const error = useRouteError();
  const chunk = isChunkLoadError(error);
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : String(error);
  const fault = chunk ? FAULTS["chunk.load_failed"] : null;
  useEffect(() => {
    if (chunk) raise("chunk.load_failed", { message });
    else log("error", "route-error", { message });
  }, [chunk, message]);

  return (
    <div role="alert" className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6">
      <TriangleAlert size={24} aria-hidden className="text-warning" />
      <h1 className="text-display text-[length:var(--step-4)] text-ink">{fault ? fault.what : "Something broke on this page."}</h1>
      <p className="text-ink-dim">{fault ? fault.why : message}</p>
      <p className="text-ink">{fault ? fault.action : "Reload the page. If it keeps happening, the CV is always available at /cv."}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] bg-primary px-4 font-medium text-on-primary"
        >
          <RefreshCw size={16} aria-hidden />
          Reload
        </button>
        <a href="/cv" className="inline-flex h-11 items-center rounded-[var(--radius-control)] border border-line-strong px-4 text-ink">
          Open CV
        </a>
      </div>
    </div>
  );
}
