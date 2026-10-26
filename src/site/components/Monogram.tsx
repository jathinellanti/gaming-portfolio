import clsx from "clsx";
import { useContent } from "../../content/useContent";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Generated avatar used until a portrait is supplied (profile.portrait). */
export function Monogram({ size = 36, className }: { size?: number; className?: string }) {
  const { profile } = useContent();
  return (
    <span
      aria-hidden
      className={clsx(
        "inline-grid shrink-0 place-items-center rounded-[10px] border border-line-strong bg-surface-2 font-display text-ink",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.48 }}
    >
      {initials(profile.name)}
    </span>
  );
}
