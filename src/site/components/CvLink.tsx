import { Download, FileText } from "lucide-react";
import { useContent } from "../../content/useContent";
import { useCvState } from "../useCv";
import { ButtonA, ButtonLink } from "./Button";

/** "Download CV" when the PDF exists; otherwise "View CV" (the /cv page). Never a dead link. */
export function CvLink({
  variant = "secondary",
  size = "sm",
  className,
  hideWhenMissing = false,
}: {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  /** On the /cv page itself, "View CV" would link to the current page. */
  hideWhenMissing?: boolean;
}) {
  const { profile } = useContent();
  const state = useCvState(profile.cvPdf);
  if (state === "missing") {
    if (hideWhenMissing) return null;
    return (
      <ButtonLink to="/cv" variant={variant} size={size} className={className}>
        <FileText size={15} aria-hidden />
        View CV
      </ButtonLink>
    );
  }
  return (
    <ButtonA href={profile.cvPdf} download variant={variant} size={size} className={className}>
      <Download size={15} aria-hidden />
      Download CV
    </ButtonA>
  );
}
