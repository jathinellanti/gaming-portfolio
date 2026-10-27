import { useCallback } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { create } from "zustand";

// "Enter the Developer's Realm": a short bloom over the page, then navigation.
// Reduced motion → navigate immediately. Never blocks access to anything.
const TRANSITION_MS = 520;

const useTransitionStore = create<{ active: boolean; origin: { x: number; y: number }; set(p: Partial<{ active: boolean; origin: { x: number; y: number } }>): void }>(
  (set) => ({ active: false, origin: { x: 50, y: 50 }, set: (p) => set(p) }),
);

export function useRealmTransition() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const set = useTransitionStore((s) => s.set);
  return useCallback(
    (to: string, from?: { clientX: number; clientY: number }) => {
      if (reduce) {
        navigate(to);
        return;
      }
      const origin = from
        ? { x: (from.clientX / window.innerWidth) * 100, y: (from.clientY / window.innerHeight) * 100 }
        : { x: 50, y: 50 };
      set({ active: true, origin });
      window.setTimeout(() => {
        navigate(to);
        set({ active: false });
      }, TRANSITION_MS);
    },
    [navigate, reduce, set],
  );
}

export function RealmTransitionOverlay() {
  const active = useTransitionStore((s) => s.active);
  const origin = useTransitionStore((s) => s.origin);
  return (
    <AnimatePresence>
      {active && (
        <m.div
          key="realm"
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[70] grid place-items-center bg-bg"
          initial={{ clipPath: `circle(0% at ${origin.x}% ${origin.y}%)` }}
          animate={{ clipPath: `circle(150% at ${origin.x}% ${origin.y}%)` }}
          exit={{ opacity: 0 }}
          transition={{ duration: TRANSITION_MS / 1000, ease: [0.2, 0, 0, 1] }}
        >
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(60% 60% at ${origin.x}% ${origin.y}%, var(--primary-soft), transparent 70%)` }}
          />
          <m.p
            className="eyebrow relative"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.25 }}
          >
            Entering the Developer&apos;s Realm
          </m.p>
        </m.div>
      )}
    </AnimatePresence>
  );
}
