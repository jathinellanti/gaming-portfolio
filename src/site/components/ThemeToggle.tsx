import { Moon, Sun } from "lucide-react";
import { useSettings } from "../../platform/settings";
import { Button } from "./Button";

export function ThemeToggle() {
  const theme = useSettings((s) => s.theme);
  const set = useSettings((s) => s.set);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Button variant="ghost" size="sm" className="w-9 px-0" aria-label={`Switch to ${next} theme`} onClick={() => set({ theme: next })}>
      {theme === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </Button>
  );
}
