import { useBlock } from "../store";
import { InventoryScreen } from "./screens/Inventory";
import { CraftingScreen } from "./screens/Crafting";
import { AdvancementsScreen } from "./screens/Advancements";
import { BookScreen } from "./screens/Book";
import { TrophiesScreen } from "./screens/Trophies";
import { DungeonScreen } from "./screens/Dungeon";
import { ExitScreen } from "./screens/Exit";
import { ChatScreen, GuideScreen, MapScreen, OptionsScreen, PauseScreen } from "./screens/Menus";

export function ScreenHost() {
  const screen = useBlock((s) => s.screen);
  const arg = useBlock((s) => s.screenArg);
  // Keyed by screen+arg so internal selection resets when an evidence link re-opens a screen.
  const key = `${screen}:${arg ?? ""}`;
  switch (screen) {
    case "inventory":
      return <InventoryScreen key={key} />;
    case "crafting":
      return <CraftingScreen key={key} />;
    case "advancements":
      return <AdvancementsScreen key={key} />;
    case "book":
      return <BookScreen key={key} />;
    case "trophies":
      return <TrophiesScreen key={key} />;
    case "dungeon":
      return <DungeonScreen key={key} />;
    case "exit":
      return <ExitScreen key={key} />;
    case "pause":
      return <PauseScreen key={key} />;
    case "options":
      return <OptionsScreen key={key} />;
    case "map":
      return <MapScreen key={key} />;
    case "chat":
      return <ChatScreen key={key} />;
    case "guide":
      return <GuideScreen key={key} />;
    default:
      return null;
  }
}
