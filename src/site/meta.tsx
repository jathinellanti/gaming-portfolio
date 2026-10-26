import { useContent } from "../content/useContent";

/** Per-route document title + description (React 19 hoists these into <head>). */
export function PageMeta({ title, description }: { title?: string; description: string }) {
  const { profile } = useContent();
  const full = title ? `${title} · ${profile.name}` : `${profile.name} · ${profile.title}`;
  return (
    <>
      <title>{full}</title>
      <meta name="description" content={description} />
    </>
  );
}
