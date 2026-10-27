import { useEffect, useState } from "react";
import clsx from "clsx";
import { prefersReducedMotion } from "../../platform/webgl";

// Types `text` out one character at a time once `start` is true, with a blinking
// caret that fades after it finishes. An invisible copy of the full text reserves
// the final size, so nothing reflows while typing; screen readers get the whole
// text at once. Reduced motion: shown complete, no caret.
// `className` styles the visible typed layer; put fills like `text-chrome` here, not on
// a parent: background-clip:text doesn't reach absolutely positioned children.
export function TypedText({ text, start, delay = 0, speed = 85, className }: { text: string; start: boolean; delay?: number; speed?: number; className?: string }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? text.length : 0));
  const [done, setDone] = useState(() => prefersReducedMotion());
  useEffect(() => {
    if (!start || prefersReducedMotion()) return;
    let i = 0;
    let tick = 0;
    setShown(0);
    setDone(false);
    const begin = window.setTimeout(() => {
      tick = window.setInterval(() => {
        i += 1;
        setShown(i);
        if (i >= text.length) {
          window.clearInterval(tick);
          setDone(true);
        }
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(begin);
      window.clearInterval(tick);
    };
  }, [start, text, delay, speed]);
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="relative inline-block">
        <span className="invisible">{text}</span>
        <span className={clsx("absolute inset-0 whitespace-pre-wrap", className)}>
          {text.slice(0, shown)}
          <span className={clsx("type-caret", done && "is-done")} />
        </span>
      </span>
    </>
  );
}
