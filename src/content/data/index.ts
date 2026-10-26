import type { Content } from "../schema";
import { profile } from "./profile";
import { education } from "./education";
import { experience } from "./experience";
import { skills } from "./skills";
import { projects } from "./projects";
import { achievements } from "./achievements";
import { caseStudies } from "./caseStudies";
import { skillTree } from "./skillTree";

export const rawContent: Content = {
  profile,
  education,
  experience,
  skills,
  projects,
  achievements,
  caseStudies,
  skillTree,
};
