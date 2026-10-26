import type { Achievement } from "../schema";

// Source: resume PDF. Add `date: "YYYY-MM"` and `credentialUrl` when available.
// Exact name matters: this is NOT the higher "Unity Certified Programmer" exam.
export const achievements: Achievement[] = [
  {
    id: "unity-certified-user-programmer",
    title: "Unity Certified User: Programmer",
    issuer: "Unity Technologies",
    kind: "certification",
  },
];
