import { useContent } from "../../content/useContent";
import { PageMeta } from "../meta";
import { Hero } from "../sections/Hero";
import { About } from "../sections/About";
import { Education } from "../sections/Education";
import { Experience } from "../sections/Experience";
import { Skills } from "../sections/Skills";
import { Projects } from "../sections/Projects";
import { Certifications } from "../sections/Certifications";
import { Contact } from "../sections/Contact";

export function Home() {
  const { profile } = useContent();
  return (
    <>
      <PageMeta description={`${profile.name}: ${profile.title}. ${profile.intro}`} />
      <Hero />
      <About />
      <Education />
      <Experience />
      <Skills />
      <Projects />
      <Certifications />
      <Contact />
    </>
  );
}
