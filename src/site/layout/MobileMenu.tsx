import type { RefObject } from "react";
import { Link } from "react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { Gamepad2, X } from "lucide-react";
import { SECTIONS } from "../nav-items";
import { Button } from "../components/Button";
import { CvLink } from "../components/CvLink";
import { useRealmTransition } from "../../play/RealmTransition";

// Loaded on first open (Nav lazy-imports it) so Radix stays off first paint.
export function MobileMenu({ open, onOpenChange, triggerRef }: { open: boolean; onOpenChange(open: boolean): void; triggerRef: RefObject<HTMLButtonElement | null> }) {
  const enterRealm = useRealmTransition();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            triggerRef.current?.focus();
          }}
          className="fixed inset-y-0 right-0 z-[81] flex w-[min(340px,88vw)] flex-col gap-6 border-l border-line-strong bg-surface-1 p-5 shadow-[var(--shadow-2)]"
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="eyebrow">Menu</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" className="w-9 px-0" aria-label="Close menu">
                <X size={18} aria-hidden />
              </Button>
            </Dialog.Close>
          </div>
          <nav aria-label="Mobile">
            <ul className="flex flex-col">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <Link to={`/#${s.id}`} onClick={() => onOpenChange(false)} className="flex h-12 items-center rounded-md px-3 text-base text-ink transition-ui hover:bg-surface-2">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            <CvLink variant="secondary" size="md" />
            <Button
              variant="primary"
              size="md"
              onClick={(e) => {
                onOpenChange(false);
                enterRealm("/play", e);
              }}
            >
              <Gamepad2 size={16} aria-hidden />
              Enter the Developer&apos;s Realm
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
