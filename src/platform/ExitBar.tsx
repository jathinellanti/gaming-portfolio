import { Link } from "react-router";
import { FileText, LogOut } from "lucide-react";

// Always on screen in the Realm (spec invariant 1): the CV is one click away.
export function ExitBar() {
  const cls =
    "inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 text-sm font-medium text-white backdrop-blur-md transition-ui hover:border-white/35 hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
  return (
    <nav aria-label="Leave the Realm" className="fixed right-3 top-3 z-[60] flex gap-2 sm:right-5 sm:top-5">
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
