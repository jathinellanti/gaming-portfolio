import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useContent } from "../../../../content/useContent";
import { buildBook, type BookPage } from "../../content";
import { useBlock } from "../../store";
import { useCloseButton } from "../useCloseButton";

// The Archive's Book & Quill: bio, education and experience as a two-page spread.
function Page({ page, n, total }: { page?: BookPage; n: number; total: number }) {
  if (!page) return <div className="flex-1 p-5" aria-hidden />;
  return (
    <article className="flex-1 p-5" aria-label={`Page ${n} of ${total}`}>
      <p className="mb-2 text-right text-xs opacity-60">
        Page {n} of {total}
      </p>
      <h3 className="text-lg font-semibold leading-tight">{page.heading}</h3>
      {page.sub && <p className="mt-1 text-sm opacity-75">{page.sub}</p>}
      <div className="mt-3 space-y-2">
        {page.body.map((b) => (
          <p key={b}>{b}</p>
        ))}
      </div>
    </article>
  );
}

export function BookScreen() {
  const content = useContent();
  const pages = useMemo(() => buildBook(content), [content]);
  const arg = useBlock((s) => s.screenArg);
  const start = typeof arg === "number" ? arg - (arg % 2) : 0;
  const [spread, setSpread] = useState(start);
  const close = useCloseButton("Close book");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setSpread((s) => Math.min(s + 2, pages.length - 1 - ((pages.length - 1) % 2)));
      if (e.key === "ArrowLeft") setSpread((s) => Math.max(0, s - 2));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pages.length]);

  return (
    <div className="jc-screen" role="dialog" aria-modal="true" aria-label="The Archive: Book and Quill">
      <div className="w-[min(760px,100%)]">
        <div className="jc-book flex flex-col divide-[#c9b98d] sm:flex-row sm:divide-x-2" style={{ minHeight: 360 }}>
          <Page page={pages[spread]} n={spread + 1} total={pages.length} />
          <Page page={pages[spread + 1]} n={spread + 2} total={pages.length} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" className="jc-btn" onClick={() => setSpread((s) => Math.max(0, s - 2))} aria-disabled={spread === 0} aria-label="Previous pages">
            <ChevronLeft size={18} aria-hidden /> Prev
          </button>
          {close}
          <button type="button" className="jc-btn" onClick={() => setSpread((s) => (s + 2 < pages.length ? s + 2 : s))} aria-disabled={spread + 2 >= pages.length} aria-label="Next pages" data-autofocus>
            Next <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
