import { ArrowUpRight, BriefcaseBusiness, Mail, MapPin } from "lucide-react";
import { useContent } from "../../content/useContent";
import { Section } from "../components/Section";
import { ButtonA } from "../components/Button";
import { CopyButton } from "../components/CopyButton";
import { BRANDS, BrandIcon } from "../components/BrandIcon";
import { CvLink } from "../components/CvLink";

export function Contact() {
  const { profile } = useContent();
  const links = [
    { label: "GitHub", href: profile.links.github, icon: <BrandIcon icon={BRANDS.github} size={18} /> },
    ...(profile.links.linkedin ? [{ label: "LinkedIn", href: profile.links.linkedin, icon: <BriefcaseBusiness size={18} aria-hidden /> }] : []),
    ...(profile.links.codechef ? [{ label: "CodeChef", href: profile.links.codechef, icon: <BrandIcon icon={BRANDS.codechef} size={18} /> }] : []),
  ];
  return (
    <Section id="contact" title="Let's build something worth playing.">
      <div className="grid gap-10 md:grid-cols-[200px_1fr] md:gap-8">
        <div aria-hidden className="hidden md:block" />
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="eyebrow">Email</p>
            <p id="contact-email" className="mt-3 select-all break-all text-[length:var(--step-3)] font-medium tracking-tight text-ink">
              {profile.email}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonA href={`mailto:${profile.email}`} variant="primary" size="md">
                <Mail size={16} aria-hidden />
                Send an email
              </ButtonA>
              <CopyButton value={profile.email} label="Copy email address" selectTargetId="contact-email" />
            </div>
            <p className="mt-8 flex items-center gap-2 text-ink-dim">
              <MapPin size={16} aria-hidden />
              {profile.location}
            </p>
          </div>
          <div>
            <p className="eyebrow">Elsewhere</p>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="group flex h-14 items-center gap-3 px-1 text-ink transition-ui hover:text-primary-text">
                    <span className="text-ink-dim transition-ui group-hover:text-primary-text">{l.icon}</span>
                    {l.label}
                    <ArrowUpRight size={16} aria-hidden className="ml-auto text-ink-faint transition-ui group-hover:text-primary-text" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <CvLink variant="secondary" size="md" />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
