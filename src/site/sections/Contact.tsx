import { useEffect, useState } from "react";
import clsx from "clsx";
import { ArrowUpRight, BriefcaseBusiness, Mail, MapPin } from "lucide-react";
import { useContent } from "../../content/useContent";
import { Section } from "../components/Section";
import { ButtonA } from "../components/Button";
import { CopyButton } from "../components/CopyButton";
import { BRANDS, BrandIcon } from "../components/BrandIcon";
import { CvLink } from "../components/CvLink";
import { SLIDES } from "./HeroCarousel";
import { prefersReducedMotion } from "../../platform/webgl";

// The closing banner: the three worlds' key art cycling behind it (like the hero),
// with every way to get in touch.
const CYCLE_MS = 6000;

function useCycle(length: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % length), CYCLE_MS);
    return () => window.clearInterval(t);
  }, [length]);
  return i;
}

export function Contact() {
  const { profile } = useContent();
  const slide = useCycle(SLIDES.length);
  const links = [
    { label: "GitHub", href: profile.links.github, icon: <BrandIcon icon={BRANDS.github} size={18} /> },
    ...(profile.links.linkedin ? [{ label: "LinkedIn", href: profile.links.linkedin, icon: <BriefcaseBusiness size={18} aria-hidden /> }] : []),
    ...(profile.links.codechef ? [{ label: "CodeChef", href: profile.links.codechef, icon: <BrandIcon icon={BRANDS.codechef} size={18} /> }] : []),
  ];
  return (
    <Section id="contact" title="Let's build something worth playing.">
      <div data-theme="dark" className="relative isolate overflow-hidden rounded-[26px] border border-line-strong text-ink">
        {SLIDES.map((s, i) => (
          <img
            key={s.id}
            aria-hidden
            src={`/hero/${s.file}-1600.webp`}
            srcSet={`/hero/${s.file}-960.webp 960w, /hero/${s.file}-1600.webp 1600w`}
            sizes="(min-width: 1200px) 1200px, 100vw"
            alt=""
            loading="lazy"
            decoding="async"
            className={clsx("hero-slide absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-[1400ms] ease-[cubic-bezier(0.2,0,0,1)]", i === slide ? "is-active opacity-100" : "opacity-0")}
            style={{ objectPosition: s.focus }}
          />
        ))}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(4_6_14/0.94)_10%,rgb(4_6_14/0.78)_50%,rgb(4_6_14/0.55)_100%)]" />
        <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:p-12">
          <div>
            <p className="eyebrow">Email</p>
            <p id="contact-email" className="font-lux mt-3 select-all break-all text-[clamp(1.6rem,3.6vw,2.75rem)] leading-[1.2] text-ink">
              {profile.email}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
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
