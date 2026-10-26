import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./Button";

type State = "idle" | "copied" | "failed";

/** Copies `value`; on clipboard failure tells the visitor how to copy manually and selects `selectTargetId`. */
export function CopyButton({ value, label, selectTargetId }: { value: string; label: string; selectTargetId?: string }) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
      const el = selectTargetId ? document.getElementById(selectTargetId) : null;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    timer.current = setTimeout(() => setState("idle"), 2400);
  };

  return (
    <span className="inline-flex items-center gap-3">
      <Button variant="secondary" size="sm" onClick={copy} aria-label={label}>
        {state === "copied" ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        {state === "copied" ? "Copied" : "Copy"}
      </Button>
      <span aria-live="polite" className="text-sm text-ink-dim">
        {state === "copied" ? "Email copied to clipboard" : state === "failed" ? "Press Ctrl+C to copy" : ""}
      </span>
    </span>
  );
}
