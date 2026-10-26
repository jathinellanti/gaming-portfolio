import type { Education } from "../schema";

// Source: resume PDF.
export const education: Education[] = [
  {
    id: "kl-university",
    institution: "KL University",
    programme: "B.Tech, Computer Science and Engineering",
    location: "Vijayawada",
    start: "2022-07",
    end: "2026-05",
    result: { label: "CGPA", value: "9.02" },
  },
  {
    id: "sri-bhavishya",
    institution: "Sri Bhavishya Junior College",
    programme: "Intermediate (BiPC)",
    location: "Vijayawada",
    start: "2020-07",
    end: "2022-06",
    result: { label: "Percentage", value: "89%" },
  },
  {
    id: "kkr-gowtham",
    institution: "KKR's Gowtham High School",
    programme: "SSC (CBSE)",
    location: "Vijayawada",
    start: "2019-07",
    end: "2020-04",
    result: { label: "Percentage", value: "91%" },
  },
];
