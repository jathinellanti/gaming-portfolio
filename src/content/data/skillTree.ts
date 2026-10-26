import type { SkillTreeNode } from "../schema";

// Specialisations for the in-game skill trees. Every node must cite evidence.
export const skillTree: SkillTreeNode[] = [
  {
    id: "programming-foundations",
    branch: "Foundations",
    title: "Programming foundations",
    summary: "Core programming in C, Java, Python and C# from a Computer Science & Engineering degree.",
    evidence: [{ kind: "education", id: "kl-university" }],
    requires: [],
  },
  {
    id: "unity-programming",
    branch: "Game Development",
    title: "Unity programming",
    summary: "Scripting gameplay in Unity with C#, certified as Unity Certified User: Programmer.",
    evidence: [{ kind: "achievement", id: "unity-certified-user-programmer" }],
    requires: ["programming-foundations"],
  },
  {
    id: "fullstack-mern",
    branch: "Web Development",
    title: "Full-stack MERN",
    summary: "Building role-based web apps with MongoDB, Express, React and Node.js.",
    evidence: [{ kind: "project", id: "employee-leave-management" }],
    requires: ["programming-foundations"],
  },
  {
    id: "python-web-backends",
    branch: "Web Development",
    title: "Python web backends",
    summary: "Server-rendered Django apps that integrate third-party REST APIs.",
    evidence: [{ kind: "project", id: "weather-information-system" }],
    requires: ["programming-foundations"],
  },
  {
    id: "uav-systems",
    branch: "Hardware & Systems",
    title: "UAV systems",
    summary: "Hands-on experience with unmanned aerial vehicle systems during an internship.",
    evidence: [{ kind: "experience", id: "drone-entry" }],
    requires: [],
  },
];
