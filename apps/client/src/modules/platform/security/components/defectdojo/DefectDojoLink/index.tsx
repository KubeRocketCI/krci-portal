import { ExternalLink } from "lucide-react";
import { ICON_LINK_CLASS } from "../utils";

interface DefectDojoLinkProps {
  href: string;
  label: string;
}

/** Icon link to a DefectDojo page. */
export const DefectDojoLink = ({ href, label }: DefectDojoLinkProps) => (
  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={ICON_LINK_CLASS}>
    <ExternalLink className="size-4" />
  </a>
);
