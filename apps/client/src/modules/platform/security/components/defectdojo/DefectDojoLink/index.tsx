import { ExternalLink } from "lucide-react";
import { CellExternalLink } from "@/core/components/Table/components/CellLink";
import { cn } from "@/core/utils/classname";

export interface DefectDojoLinkProps {
  href: string;
  /** Visible text. Without it the link is an icon. */
  children?: string;
  /** Names the object the link opens. Starts with the visible text, if any. */
  label: string;
  className?: string;
}

/** Link into the DefectDojo UI, opened in a new tab. DefectDojo decides who may open the page. */
export function DefectDojoLink({ href, children, label, className }: DefectDojoLinkProps) {
  const common = {
    href,
    icon: ExternalLink,
    "aria-label": `${label} (opens DefectDojo in a new tab)`,
    title: label,
    className: cn("w-auto", className),
  };

  return children ? <CellExternalLink {...common} text={children} /> : <CellExternalLink {...common} iconOnly />;
}
