import type { Profile } from "../schema";

// Source: resume PDF (2026-10). Phone and street address are intentionally not
// published on the website. Add `linkedin` / `codechef` URLs here when available.
export const profile: Profile = {
  name: "Ellanti Jathin",
  shortName: "Jathin",
  title: "Software Developer",
  subtitle: "Unity Certified User: Programmer",
  intro:
    "Computer Science & Engineering at KL University (2022–2026, CGPA 9.02). I build full-stack web apps with React, Node and Django, and I'm growing into game development with Unity and C#.",
  about: [
    "I studied Computer Science and Engineering at KL University, Vijayawada, graduating with a CGPA of 9.02.",
    "My projects so far are full-stack web applications: a Django weather app backed by the OpenWeatherMap API, and a team-built MERN employee leave management system with separate Admin, HR and Employee dashboards.",
    "I interned at Drone Entry in Bangkok, working hands-on with UAV systems, and I hold the Unity Certified User: Programmer certification.",
  ],
  location: "Vijayawada, India",
  email: "jathinellanti@gmail.com",
  links: {
    github: "https://github.com/jathinellanti",
  },
  cvPdf: "/cv/Ellanti_Jathin_CV.pdf",
  lastUpdated: "2026-10",
};
