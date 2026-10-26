import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export function buttonClass({ variant = "secondary", size = "md", className }: { variant?: Variant; size?: Size; className?: string }) {
  return clsx(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] font-medium transition-ui",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
    size === "sm" && "h-9 px-3 text-sm",
    size === "md" && "h-11 px-4 text-[0.95rem]",
    size === "lg" && "h-12 px-5 text-base",
    variant === "primary" && "bg-primary text-on-primary shadow-[var(--shadow-1)] hover:bg-primary-hover",
    variant === "secondary" && "border border-line-strong bg-surface-1 text-ink shadow-[var(--shadow-1)] hover:bg-surface-2",
    variant === "ghost" && "text-ink-dim hover:bg-surface-2 hover:text-ink",
    className,
  );
}

type Style = { variant?: Variant; size?: Size };

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & Style>(
  function Button({ variant, size, className, type = "button", ...rest }, ref) {
    return <button ref={ref} type={type} className={buttonClass({ variant, size, className })} {...rest} />;
  },
);

export function ButtonLink({ variant, size, className, ...rest }: LinkProps & Style) {
  return <Link className={buttonClass({ variant, size, className })} {...rest} />;
}

export function ButtonA({ variant, size, className, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & Style) {
  return <a className={buttonClass({ variant, size, className })} {...rest} />;
}
