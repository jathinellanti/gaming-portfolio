import clsx from "clsx";
import type { ProjectImage } from "../../../content/schema";

/** A real screenshot inside minimal browser chrome. */
export function BrowserFrame({ image, priority = false, decorative = false, className }: { image: ProjectImage; priority?: boolean; decorative?: boolean; className?: string }) {
  return (
    <div className={clsx("overflow-hidden rounded-[10px] border border-line-strong bg-surface-2 shadow-[0_30px_60px_-24px_rgb(0_0_0/0.75)]", className)}>
      <div aria-hidden className="flex h-4 items-center gap-1 border-b border-line px-2 sm:h-6 sm:gap-1.5 sm:px-3">
        <span className="size-1.5 rounded-full bg-danger opacity-80 sm:size-2" />
        <span className="size-1.5 rounded-full bg-warning opacity-80 sm:size-2" />
        <span className="size-1.5 rounded-full bg-success opacity-80 sm:size-2" />
        <span className="ml-2 h-1.5 w-1/3 rounded-full bg-[color-mix(in_oklab,var(--text)_14%,transparent)] sm:h-2" />
      </div>
      <img
        src={image.src}
        alt={decorative ? "" : image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="block h-auto w-full"
      />
    </div>
  );
}
