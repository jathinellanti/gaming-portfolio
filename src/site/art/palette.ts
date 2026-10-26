// Illustration palettes for the three worlds. These are art colours, not UI
// tokens. They stay the same in light and dark themes, like a painting would.

export const BLOCK = {
  grass: ["#7cc94f", "#6dbb44", "#5fa83a"],
  grassSide: ["#64ad3d", "#58a035", "#4c8f2e"],
  dirt: ["#9a6a3f", "#8b5d36", "#7a512e"],
  stone: ["#a3a3a3", "#929292", "#808080"],
  logSide: ["#6f4d2b", "#634426", "#563a20"],
  logTop: ["#b48c55", "#a47e4a", "#94713f"],
  leaves: ["#4aa33a", "#3f932f", "#347f27"],
  water: ["#4f86f0", "#3f76e4", "#3468cf"],
  sand: ["#e8d79a", "#dccb8c", "#cdbb7c"],
  ore: ["#f2c94c", "#e0b73b"],
} as const;

export const NEON = {
  towerTop: "#252a44",
  towerLeft: "#151931",
  towerRight: "#0d1024",
  plinth: "#0b0d18",
  plinthEdge: "#1c2140",
  windowOff: "#1d2240",
  cyan: "#3ef0ff",
  magenta: "#ff3ea5",
  amber: "#ffb547",
  yellow: "#f3e600",
  rain: "#9fe9ff",
} as const;

/** Backdrops behind each world's art on World Select cards. */
export const WORLD_SCENE = {
  block: "linear-gradient(180deg, #7fb6ff 0%, #a9d2ff 55%, #d9ecff 100%)",
  neon: "radial-gradient(120% 80% at 60% 10%, #2a1446 0%, #0d0b1f 55%, #05050c 100%)",
  city: "linear-gradient(180deg, #ff9a6b 0%, #ffc27a 40%, #ffe2a8 70%, #8fd3ee 100%)",
} as const;

export const CITY = {
  sand: "#efd19a",
  sandShade: "#d9b97f",
  grass: "#8fca6a",
  road: "#3b3e46",
  roadLine: "#f4d35e",
  sidewalk: "#c9c0b2",
  sidewalkShade: "#ada394",
  water: "#36a9d6",
  waterLight: "#8fdcf2",
  buildings: [
    { top: "#f6dcc0", left: "#f0c7a0", right: "#d9a77c" },
    { top: "#cfe3ee", left: "#a9cde0", right: "#86b1c8" },
    { top: "#f7c6b6", left: "#f0a48c", right: "#d6836b" },
  ],
  window: "#5e8fb0",
  windowLit: "#ffe7a8",
  palmTrunk: "#8a6a4a",
  palmLeaf: "#3d9a5b",
  palmLeafDark: "#2d7d48",
  car: { top: "#ff5a4f", left: "#e0443a", right: "#b8342c", glass: "#a6dcf0" },
  sun: "#ffb36b",
} as const;
