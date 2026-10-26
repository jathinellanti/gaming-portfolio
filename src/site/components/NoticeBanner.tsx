import { useSearchParams } from "react-router";
import { MonitorX, X } from "lucide-react";
import { FAULTS } from "../../platform/faults";

// Explains why a game redirected here (e.g. no WebGL), using the fault's own words.
const NOTICES = { webgl: FAULTS["webgl.unsupported"] } as const;

export function NoticeBanner() {
  const [params, setParams] = useSearchParams();
  const key = params.get("notice");
  if (!key || !(key in NOTICES)) return null;
  const f = NOTICES[key as keyof typeof NOTICES];
  return (
    <div role="status" className="no-print mx-auto mt-4 flex max-w-[1200px] items-start gap-3 px-4 sm:px-6 lg:px-8">
      <div className="flex w-full items-start gap-3 rounded-[var(--radius-card)] border border-line-strong bg-surface-1 p-4 shadow-[var(--shadow-1)]">
        <MonitorX size={18} aria-hidden className="mt-0.5 shrink-0 text-warning" />
        <p className="flex-1 text-sm text-ink-dim">
          <span className="font-medium text-ink">{f.what}</span> {f.why} {f.action}
        </p>
        <button
          type="button"
          aria-label="Dismiss notice"
          className="grid size-8 shrink-0 place-items-center rounded-md text-ink-dim transition-ui hover:bg-surface-2 hover:text-ink"
          onClick={() => {
            params.delete("notice");
            setParams(params, { replace: true });
          }}
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
