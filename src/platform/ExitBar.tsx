import { Link } from "react-router";
import { FileText, LogOut, Volume2, VolumeX } from "lucide-react";
import { useSettings } from "./settings";
import { getAudio } from "./audio";

// Always on screen in the Realm (spec invariant 1): the CV is one click away,
// and so is the mute switch.
export function ExitBar() {
  const sound = useSettings((s) => s.sound);
  const setSettings = useSettings((s) => s.set);
  // Shared chrome; padding is per control (one class list each, so nothing fights).
  const base =
    "inline-flex h-10 items-center rounded-full border border-white/15 bg-black/55 text-sm font-medium text-white backdrop-blur-md transition-ui hover:border-white/35 hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
  const cls = `${base} gap-2 px-4`;
  const toggleSound = () => {
    setSettings({ sound: !sound });
    if (!sound) getAudio(); // this click is the gesture that lets the browser start audio
  };
  return (
    <nav aria-label="Leave the Realm" className="fixed right-3 top-3 z-[60] flex gap-2 sm:right-5 sm:top-5">
      <button type="button" className={`${base} w-10 justify-center`} aria-pressed={!sound} aria-label={sound ? "Mute sound" : "Unmute sound"} title={sound ? "Mute sound" : "Unmute sound"} onClick={toggleSound}>
        {sound ? <Volume2 size={16} aria-hidden /> : <VolumeX size={16} aria-hidden />}
      </button>
      <Link to="/cv" className={cls}>
        <FileText size={15} aria-hidden />
        CV
      </Link>
      <Link to="/" className={cls} aria-label="Exit to Professional Portfolio">
        <LogOut size={15} aria-hidden />
        <span>
          Exit<span className="hidden sm:inline"> to Professional</span>
        </span>
      </Link>
    </nav>
  );
}
