import { useEffect } from "react";
import { startAmbience, type AmbienceKind } from "./ambience";
import { startMusic } from "./music";

/**
 * Plays a world's ambience and music while the calling component is mounted.
 * `daylight` (0 night … 1 noon) is polled every 2 s, e.g. for birds vs crickets.
 * Pass a stable (module-level) getter: a new identity restarts the audio.
 */
export function useWorldAudio(kind: AmbienceKind, daylight?: () => number) {
  useEffect(() => {
    const ambience = startAmbience(kind);
    const music = startMusic(kind);
    let poll = 0;
    if (daylight) {
      ambience.setDaylight(daylight());
      poll = window.setInterval(() => ambience.setDaylight(daylight()), 2000);
    }
    return () => {
      window.clearInterval(poll);
      ambience.stop();
      music.stop();
    };
  }, [kind, daylight]);
}
