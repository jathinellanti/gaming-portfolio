// The professional site's sections, in page order (work first: it's what recruiters
// scan for). Section components use these ids; nav, palette and the CV page link to them.
export const SECTIONS = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "certifications", label: "Certifications" },
  { id: "contact", label: "Contact" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export const sectionLabel = (id: SectionId) => SECTIONS.find((s) => s.id === id)!.label;
export const sectionNumber = (id: SectionId) => String(SECTIONS.findIndex((s) => s.id === id) + 1).padStart(2, "0");
