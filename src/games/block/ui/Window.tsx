import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { useBlock } from "../store";

// Shared GUI chrome: a modal window (focus moves in, Esc closes via BlockGame),
// item slots, and a tooltip that follows the pointer or keyboard focus.

export function GuiWindow({ title, children, width = 560, panelClass = "jc-panel" }: { title: string; children: ReactNode; width?: number; panelClass?: string }) {
  const close = useBlock((s) => s.close);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const first = ref.current?.querySelector<HTMLElement>("[data-autofocus], button, a, [tabindex='0']");
    first?.focus();
  }, []);
  const id = `jc-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="jc-screen" role="dialog" aria-modal="true" aria-labelledby={id}>
      <div ref={ref} className={panelClass} style={{ width: `min(${width}px, 100%)` }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={id} className="text-xl">
            {title}
          </h2>
          <button type="button" className="jc-btn" style={{ minHeight: 32, padding: "0 8px" }} onClick={close} aria-label={`Close ${title}`}>
            <X size={16} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export interface TipContent {
  title: string;
  titleClass?: string;
  lines: { text: string; cls?: string }[];
}

export function useTooltip() {
  const [tip, setTip] = useState<{ content: TipContent; x: number; y: number } | null>(null);
  const bind = (content: TipContent) => ({
    onPointerMove: (e: React.PointerEvent) => setTip({ content, x: e.clientX, y: e.clientY }),
    onPointerLeave: () => setTip(null),
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setTip({ content, x: r.right, y: r.top });
    },
    onBlur: () => setTip(null),
  });
  const node = tip ? (
    <div className="jc-tooltip" style={{ left: Math.min(tip.x + 14, window.innerWidth - 310), top: Math.max(8, tip.y - 12) }} role="tooltip">
      <p className={tip.content.titleClass ?? ""}>{tip.content.title}</p>
      {tip.content.lines.map((l, i) => (
        <p key={i} className={l.cls ?? "lore"}>
          {l.text}
        </p>
      ))}
    </div>
  ) : null;
  return { bind, node };
}

export function Slot({ icon, label, pressed, onClick, tip, count }: { icon?: string; label: string; pressed?: boolean; onClick?: () => void; tip?: ReturnType<ReturnType<typeof useTooltip>["bind"]>; count?: number }) {
  if (!icon) return <span className="jc-slot is-empty" aria-hidden />;
  return (
    <button type="button" className="jc-slot" aria-label={label} aria-pressed={pressed} onClick={onClick} {...tip}>
      <img src={icon} alt="" draggable={false} />
      {count !== undefined && (
        <span className="absolute bottom-0 right-1 text-sm font-bold text-white" style={{ textShadow: "2px 2px 0 #3f3f3f" }}>
          {count}
        </span>
      )}
    </button>
  );
}
