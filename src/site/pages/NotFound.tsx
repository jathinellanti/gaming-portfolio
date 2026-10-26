import { Compass } from "lucide-react";
import { ButtonLink } from "../components/Button";
import { PageMeta } from "../meta";

export function NotFound({ title = "Page not found", body = "That address doesn't lead anywhere on this site." }: { title?: string; body?: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[1200px] flex-col justify-center gap-6 px-4 py-24 sm:px-6 lg:px-8">
      <PageMeta title={title} description={body} />
      <Compass size={28} aria-hidden className="text-primary-text" />
      <h1 className="text-display text-[length:var(--step-5)] text-ink">{title}</h1>
      <p className="max-w-[50ch] text-[length:var(--step-1)] text-ink-dim">{body}</p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink to="/" variant="primary">
          Back home
        </ButtonLink>
        <ButtonLink to="/cv" variant="secondary">
          View CV
        </ButtonLink>
        <ButtonLink to="/play" variant="ghost">
          Developer&apos;s Realm
        </ButtonLink>
      </div>
    </div>
  );
}
