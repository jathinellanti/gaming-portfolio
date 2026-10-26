import { Link } from "react-router";
import { Gamepad2 } from "lucide-react";
import { useContent } from "../../content/useContent";
import { formatMonth } from "../format";
import { Button } from "../components/Button";
import { useRealmTransition } from "../../play/RealmTransition";

export function Footer() {
  const { profile } = useContent();
  const enterRealm = useRealmTransition();
  return (
    <footer className="no-print border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
        <div className="max-w-md">
          <p className="text-display text-[length:var(--step-3)] text-ink">Prefer to play?</p>
          <p className="mt-2 text-ink-dim">The same CV, told through three explorable game worlds.</p>
          <Button variant="secondary" size="md" className="mt-5" onClick={(e) => enterRealm("/play", e)}>
            <Gamepad2 size={16} aria-hidden />
            Enter the Developer&apos;s Realm
          </Button>
        </div>
        <div className="flex flex-col gap-2 text-sm text-ink-faint md:items-end">
          <p>
            © {new Date().getFullYear()} {profile.name}. Updated <span className="tabular">{formatMonth(profile.lastUpdated)}</span>.
          </p>
          <p>
            <Link to="/cv" className="underline-offset-4 transition-ui hover:text-ink hover:underline">
              Printable CV
            </Link>
            <span aria-hidden> · </span>
            <a href="/assets/LICENSES.md" className="underline-offset-4 transition-ui hover:text-ink hover:underline">
              Asset credits
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
