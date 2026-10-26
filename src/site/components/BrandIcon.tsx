import {
  siBootstrap,
  siC,
  siCodechef,
  siCss,
  siDjango,
  siExpress,
  siGit,
  siGithub,
  siHtml5,
  siJavascript,
  siMongodb,
  siMui,
  siNodedotjs,
  siOpenjdk,
  siPython,
  siReact,
  siSqlite,
  siUnity,
  type SimpleIcon,
} from "simple-icons";

// Brand marks come from Simple Icons (CC0). They render monochrome (currentColor)
// so the palette stays disciplined. Skills without an exact mark (C#, VS Code, SQL)
// fall back to a monogram rather than a near-miss logo of a different product.
const SKILL_ICONS: Record<string, SimpleIcon> = {
  python: siPython,
  c: siC,
  java: siOpenjdk,
  javascript: siJavascript,
  react: siReact,
  django: siDjango,
  nodejs: siNodedotjs,
  express: siExpress,
  "material-ui": siMui,
  bootstrap: siBootstrap,
  html: siHtml5,
  css: siCss,
  unity: siUnity,
  mongodb: siMongodb,
  sqlite: siSqlite,
  git: siGit,
};

export const BRANDS = { github: siGithub, codechef: siCodechef } as const;

/** The Simple Icons mark for a skill id, if one exactly matches (used by game item icons too). */
export const skillSimpleIcon = (id: string): SimpleIcon | undefined => SKILL_ICONS[id];

export function BrandIcon({ icon, size = 16, className }: { icon: SimpleIcon; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden className={className}>
      <path d={icon.path} />
    </svg>
  );
}

export function SkillIcon({ id, name, size = 16, className }: { id: string; name: string; size?: number; className?: string }) {
  const icon = SKILL_ICONS[id];
  if (icon) return <BrandIcon icon={icon} size={size} className={className} />;
  return (
    <span aria-hidden className={className} style={{ fontSize: size * 0.62, width: size, height: size, display: "inline-grid", placeItems: "center", fontFamily: "var(--font-mono-family)", fontWeight: 700 }}>
      {name.slice(0, 2)}
    </span>
  );
}
