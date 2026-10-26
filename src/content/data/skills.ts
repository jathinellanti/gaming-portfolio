import type { Skill, EvidenceRef } from "../schema";

// Source: resume skills list, plus technologies evidenced in the two public repos
// and the Unity certification. No proficiency levels: none were supplied.
const weather: EvidenceRef = { kind: "project", id: "weather-information-system" };
const elms: EvidenceRef = { kind: "project", id: "employee-leave-management" };
const unityCert: EvidenceRef = { kind: "achievement", id: "unity-certified-user-programmer" };

export const skills: Skill[] = [
  { id: "csharp", name: "C#", category: "languages", evidence: [unityCert] },
  { id: "python", name: "Python", category: "languages", evidence: [weather] },
  { id: "c", name: "C", category: "languages", evidence: [] },
  { id: "java", name: "Java", category: "languages", evidence: [] },
  { id: "javascript", name: "JavaScript", category: "languages", evidence: [elms] },

  { id: "react", name: "React", category: "frameworks", evidence: [elms] },
  { id: "django", name: "Django", category: "frameworks", evidence: [weather] },
  { id: "nodejs", name: "Node.js", category: "frameworks", evidence: [elms] },
  { id: "express", name: "Express", category: "frameworks", evidence: [elms] },
  { id: "mongoose", name: "Mongoose", category: "frameworks", evidence: [elms] },
  { id: "material-ui", name: "Material UI", category: "frameworks", evidence: [elms] },
  { id: "bootstrap", name: "Bootstrap", category: "frameworks", evidence: [elms] },
  { id: "html", name: "HTML", category: "frameworks", evidence: [weather, elms] },
  { id: "css", name: "CSS", category: "frameworks", evidence: [weather, elms] },

  { id: "unity", name: "Unity", category: "engines", evidence: [unityCert] },

  { id: "sql", name: "SQL", category: "databases", evidence: [] },
  { id: "mongodb", name: "MongoDB", category: "databases", evidence: [elms] },
  { id: "sqlite", name: "SQLite", category: "databases", evidence: [weather] },

  { id: "git", name: "Git", category: "tools", evidence: [] },
  { id: "vscode", name: "VS Code", category: "tools", evidence: [] },
];
