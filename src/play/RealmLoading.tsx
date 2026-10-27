// Shown while a Realm route's code downloads (react-router HydrateFallback /
// pending UI). Always offers the way out, so loading never traps a visitor.
export function RealmLoading({ label = "Loading the Realm" }: { label?: string }) {
  return (
    <div data-theme="dark" role="status" aria-live="polite" className="grid min-h-dvh place-items-center bg-[#07070b] text-white">
      <div className="flex flex-col items-center gap-5">
        <span aria-hidden className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-[#22d3ee]" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/70">{label}</p>
        <a href="/cv" className="text-sm text-white/60 underline underline-offset-4 hover:text-white">
          Open the CV instead
        </a>
      </div>
    </div>
  );
}
