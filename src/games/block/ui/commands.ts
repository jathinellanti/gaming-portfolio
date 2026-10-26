import { REGIONS, type RegionId, type ScreenId } from "../world/structures";

// Chat commands (T or /). Pure parser: returns what should happen; the chat
// screen performs it. Unknown input never throws.

export type CommandAction =
  | { type: "teleport"; region: RegionId }
  | { type: "teleportXYZ"; x: number; y: number; z: number }
  | { type: "open"; screen: ScreenId | "map" | "options" }
  | { type: "time"; value: number }
  | { type: "navigate"; to: string };

export type CommandResult = { ok: boolean; message: string; action?: CommandAction };

const ALIASES: Record<string, RegionId> = {
  spawn: "spawn",
  plaza: "spawn",
  archive: "archive",
  library: "archive",
  book: "archive",
  armory: "armory",
  skills: "armory",
  shrine: "shrine",
  advancements: "shrine",
  crafting: "crafting",
  projects: "crafting",
  dungeon: "dungeon",
  bosses: "dungeon",
  trophies: "trophies",
  achievements: "trophies",
  exit: "exit",
  contact: "exit",
};

export const HELP_LINES = [
  "/tp <place>: archive, armory, shrine, crafting, dungeon, trophies, exit, spawn",
  "/cv: open the printable CV · /skills · /projects · /map",
  "/time set day|night · /seed · /help",
];

export function runCommand(input: string): CommandResult {
  const text = input.trim();
  if (!text) return { ok: false, message: "" };
  if (!text.startsWith("/")) return { ok: true, message: `<Visitor> ${text}` };
  const [cmd, ...args] = text.slice(1).split(/\s+/);
  switch (cmd.toLowerCase()) {
    case "help":
      return { ok: true, message: HELP_LINES.join("\n") };
    case "tp":
    case "teleport":
    case "warp": {
      if (args.length === 3 && args.every((a) => /^-?\d+(\.\d+)?$/.test(a))) {
        const [x, y, z] = args.map(Number);
        if (Math.abs(x) > 2000 || Math.abs(z) > 2000 || y < 1 || y > 95) return { ok: false, message: "Coordinates out of range (|x|,|z| ≤ 2000, 1 ≤ y ≤ 95)." };
        return { ok: true, message: `Teleporting to ${x} ${y} ${z}`, action: { type: "teleportXYZ", x, y, z } };
      }
      const region = ALIASES[(args[0] ?? "").toLowerCase()];
      if (!region) return { ok: false, message: `Unknown place "${args[0] ?? ""}". Try /tp archive (or see /help).` };
      const name = REGIONS.find((r) => r.id === region)!.name;
      return { ok: true, message: `Teleporting to ${name}`, action: { type: "teleport", region } };
    }
    case "spawn":
      return { ok: true, message: "Teleporting to spawn", action: { type: "teleport", region: "spawn" } };
    case "cv":
    case "resume":
      return { ok: true, message: "Opening the CV…", action: { type: "navigate", to: "/cv" } };
    case "skills":
      return { ok: true, message: "Opening the Armory", action: { type: "open", screen: "inventory" } };
    case "projects":
      return { ok: true, message: "Opening the recipe book", action: { type: "open", screen: "crafting" } };
    case "map":
      return { ok: true, message: "Opening the map", action: { type: "open", screen: "map" } };
    case "time": {
      if (args[0] !== "set") return { ok: false, message: "Usage: /time set day|noon|night|midnight" };
      const v = { day: 0.08, noon: 0.25, sunset: 0.48, night: 0.62, midnight: 0.75 }[(args[1] ?? "").toLowerCase()];
      if (v === undefined) return { ok: false, message: "Usage: /time set day|noon|night|midnight" };
      return { ok: true, message: `Time set to ${args[1]}`, action: { type: "time", value: v } };
    }
    case "seed":
      return { ok: true, message: "Seed: 20260526" };
    default:
      return { ok: false, message: `Unknown command "/${cmd}". Type /help for a list.` };
  }
}
