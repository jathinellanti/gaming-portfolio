import { useContent } from "../../content/useContent";
import { PageMeta } from "../meta";
import { Hero } from "../sections/Hero";
import { StatsStrip } from "../sections/StatsStrip";
import { Marquee } from "../sections/Marquee";
import { About } from "../sections/About";
import { Projects } from "../sections/Projects";
import { Skills } from "../sections/Skills";
import { Realm } from "../sections/Realm";
import { Experience } from "../sections/Experience";
import { Education } from "../sections/Education";
import { Contact } from "../sections/Contact";

export function Home() {
  const { profile } = useContent();
  return (
    <>
      <PageMeta description={`${profile.name}: ${profile.title}. ${profile.intro}`} />
      <Hero />
      <StatsStrip />
      <Marquee />
      <About />
      <Projects />
      <Skills />
      <Realm />
      <Experience />
      <Education />
      <Contact />
    </>
  );
}
