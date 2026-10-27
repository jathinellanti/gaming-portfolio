// The three games, as shown on World Select. Status flips to "available" as each
// game ships (Phases 2–4).
export type WorldId = "block" | "neon" | "city";

export interface World {
  id: WorldId;
  /** Key-art file stem in public/hero (responsive WebP variants). */
  art: string;
  /** Portrait crop of the key art in public/art (made by tools/crop-art.mjs), for character cards. */
  card: string;
  title: string;
  style: string;
  pitch: string;
  controls: string;
  cv: string[];
  status: "available" | "in-development";
}

export const WORLDS: World[] = [
  {
    id: "block",
    art: "block-world",
    card: "block-tall",
    title: "JATHINCRAFT",
    style: "Block world · first person",
    pitch: "Break, build and explore a voxel island where every building holds part of my CV.",
    controls: "WASD · mouse · E skills · L skill tree · M map · T chat",
    cv: ["Projects as crafting recipes", "Skills in a creative-style inventory", "Advancements = skill tree"],
    status: "available",
  },
  {
    id: "neon",
    art: "neon-city",
    card: "neon-tall",
    title: "NEON//SPRAWL",
    style: "Neon megacity · first person",
    pitch: "Walk a rain-soaked night city. Scan the streets, visit the ripperdoc and read the shards.",
    controls: "WASD · mouse · hold Tab to scan · F enter · J jobs · M map",
    cv: ["Skills as installable cyberware", "Projects as jobs in your journal", "Achievements as data shards"],
    status: "available",
  },
  {
    id: "city",
    art: "open-city",
    card: "city-tall",
    title: "SUNSET BAY",
    style: "Open city · third person",
    pitch: "Drive a sunset coastal city, hit the mission markers and use the phone to get in touch.",
    controls: "WASD run/drive · mouse look · F get in/out · Space handbrake · ↑ phone · M map",
    cv: ["Projects and CV sections as missions", "Fast travel from the map", "Contact via your phone"],
    status: "available",
  },
];
