import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import clsx from "clsx";
import { Command as CommandIcon, Menu } from "lucide-react";
import { useContent } from "../../content/useContent";
import { SECTIONS } from "../nav-items";
import { Monogram } from "../components/Monogram";
import { ThemeToggle } from "../components/ThemeToggle";
import { CvLink } from "../components/CvLink";
import { Button } from "../components/Button";

const MobileMenu = lazy(() => import("./MobileMenu").then((m) => ({ default: m.MobileMenu })));

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

const linkClass = "rounded-md px-2.5 py-1.5 text-sm text-ink-dim transition-ui hover:bg-surface-2 hover:text-ink";

export function Nav({ onOpenPalette }: { onOpenPalette(): void }) {
  const { profile } = useContent();
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  return (
    <header
      className={clsx(
        "no-print sticky top-0 z-50 h-[var(--nav-h)] transition-ui",
        scrolled ? "border-b border-line bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] backdrop-blur-md" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 rounded-md transition-ui hover:opacity-90" aria-label={`${profile.name}, home`}>
          <Monogram size={34} />
          <span className="font-lux hidden text-[13px] uppercase tracking-[0.3em] text-ink sm:inline">{profile.name}</span>
        </Link>

        <nav aria-label="Primary" className="mx-auto hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <Link to={`/#${s.id}`} className={linkClass}>
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <span className="hidden sm:contents">
            <Button variant="ghost" size="sm" onClick={onOpenPalette} aria-label="Open jump menu (Ctrl+K)" className="gap-1.5">
              <CommandIcon size={14} aria-hidden />
              <kbd className="font-mono text-xs text-ink-faint">K</kbd>
            </Button>
          </span>
          <ThemeToggle />
          <CvLink variant="primary" size="sm" />
          <span className="contents lg:hidden">
            <Button
              ref={menuButton}
              variant="ghost"
              size="sm"
              className="w-9 px-0"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuLoaded(true);
                setMenuOpen(true);
              }}
            >
              <Menu size={18} aria-hidden />
            </Button>
          </span>
          {menuLoaded && (
            <Suspense fallback={null}>
              <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} triggerRef={menuButton} />
            </Suspense>
          )}
        </div>
      </div>
    </header>
  );
}
