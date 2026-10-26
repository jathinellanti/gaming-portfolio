import { useNavigate } from "react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { ArrowRight, FileText, FolderGit2, Gamepad2, Hash, Moon, Search } from "lucide-react";
import { useContent } from "../../content/useContent";
import { useSettings } from "../../platform/settings";
import { SECTIONS } from "../nav-items";
import { useRealmTransition } from "../../play/RealmTransition";

const itemClass =
  "flex h-11 cursor-pointer items-center gap-3 rounded-[8px] px-3 text-sm text-ink-dim data-[selected=true]:bg-surface-3 data-[selected=true]:text-ink";

export function Palette({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  const { projects } = useContent();
  const navigate = useNavigate();
  const enterRealm = useRealmTransition();
  const theme = useSettings((s) => s.theme);
  const setSettings = useSettings((s) => s.set);

  // The Ctrl/⌘+K shortcut lives in SiteLayout so it can trigger this lazy chunk's first load.
  const run = (fn: () => void) => () => {
    onOpenChange(false);
    fn();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-[81] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-surface-1 shadow-[var(--shadow-2)]"
        >
          <Dialog.Title className="sr-only">Jump to</Dialog.Title>
          <Command label="Jump to" loop>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={16} aria-hidden className="text-ink-faint" />
              <Command.Input placeholder="Jump to a section, project or page…" className="h-12 w-full bg-transparent text-[0.95rem] text-ink outline-none placeholder:text-ink-faint" />
            </div>
            <Command.List className="max-h-[50vh] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-sm text-ink-dim">No match. Try “projects” or “cv”.</Command.Empty>
              <Command.Group heading="Sections" className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                {SECTIONS.map((s) => (
                  <Command.Item key={s.id} value={`section ${s.label}`} onSelect={run(() => navigate(`/#${s.id}`))} className={itemClass}>
                    <Hash size={15} aria-hidden />
                    {s.label}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Projects" className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                {projects.map((p) => (
                  <Command.Item key={p.slug} value={`project ${p.title}`} onSelect={run(() => navigate(`/projects/${p.slug}`))} className={itemClass}>
                    <FolderGit2 size={15} aria-hidden />
                    {p.title}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                <Command.Item value="view cv resume" onSelect={run(() => navigate("/cv"))} className={itemClass}>
                  <FileText size={15} aria-hidden />
                  View CV
                </Command.Item>
                <Command.Item value="enter the developer's realm play game" onSelect={run(() => enterRealm("/play"))} className={itemClass}>
                  <Gamepad2 size={15} aria-hidden />
                  Enter the Developer&apos;s Realm
                  <ArrowRight size={14} aria-hidden className="ml-auto" />
                </Command.Item>
                <Command.Item value="toggle theme light dark" onSelect={run(() => setSettings({ theme: theme === "dark" ? "light" : "dark" }))} className={itemClass}>
                  <Moon size={15} aria-hidden />
                  Switch to {theme === "dark" ? "light" : "dark"} theme
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
