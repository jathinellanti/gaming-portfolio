import { create } from "zustand";

// Whether the monogram intro is showing. Decided once, at load: only on the home
// page, only without a #section deep link, and once per browser session. If
// sessionStorage is blocked the intro is skipped rather than shown every time.
export const INTRO_KEY = "jp.intro.v1";

function shouldShowIntro(): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.pathname !== "/" || window.location.hash) return false;
  try {
    return sessionStorage.getItem(INTRO_KEY) === null;
  } catch {
    return false;
  }
}

export const useIntro = create<{ open: boolean; enter(): void }>((set) => ({
  open: shouldShowIntro(),
  enter() {
    try {
      sessionStorage.setItem(INTRO_KEY, "seen");
    } catch {
      /* storage blocked: the intro simply won't be remembered */
    }
    set({ open: false });
  },
}));
