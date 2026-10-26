import { lazy, Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { RealmTransitionOverlay } from "../../play/RealmTransition";
import { NoticeBanner } from "../components/NoticeBanner";

// The palette (cmdk + Radix) loads on first use: Ctrl/⌘+K or the nav button.
const Palette = lazy(() => import("../components/Palette").then((m) => ({ default: m.Palette })));

export function SiteLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);

  const openPalette = (open: boolean) => {
    if (open) setPaletteLoaded(true);
    setPaletteOpen(open);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteLoaded(true);
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <a
        href="#main"
        className="no-print fixed left-4 top-3 z-[90] -translate-y-16 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary transition-ui focus:translate-y-0"
      >
        Skip to content
      </a>
      <Nav onOpenPalette={() => openPalette(true)} />
      <NoticeBanner />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer />
      {paletteLoaded && (
        <Suspense fallback={null}>
          <Palette open={paletteOpen} onOpenChange={openPalette} />
        </Suspense>
      )}
      <RealmTransitionOverlay />
    </>
  );
}
