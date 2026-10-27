import type { MissionId } from "./world/layout";

// CV → SUNSET BAY missions. Each marker is a place in the city that opens one part
// of the CV; the card reads the real content (src/content), never typed-in text.

export type MissionKind = "profile" | "project" | "skills" | "education" | "experience" | "certifications";

export interface Mission {
  id: MissionId;
  /** The place, as signposted in the city. */
  place: string;
  /** Mission title on the card and the "MISSION PASSED" screen. */
  title: string;
  kind: MissionKind;
  /** For project missions: the project slug in content. */
  project?: string;
}

export const MISSIONS: Mission[] = [
  { id: "safehouse", place: "The Safehouse", title: "Who's Jathin?", kind: "profile" },
  { id: "weather", place: "Weather Plaza", title: "Forecast Run", kind: "project", project: "weather-information-system" },
  { id: "elms", place: "Office Park", title: "Leave It To Me", kind: "project", project: "employee-leave-management" },
  { id: "skills", place: "Tech Shop", title: "Gear Up", kind: "skills" },
  { id: "campus", place: "The Campus", title: "Hit The Books", kind: "education" },
  { id: "harbor", place: "The Harbor", title: "Overseas Job", kind: "experience" },
  { id: "studio", place: "Game Studio", title: "Certified", kind: "certifications" },
];

export const missionById = (id: MissionId) => MISSIONS.find((m) => m.id === id)!;
