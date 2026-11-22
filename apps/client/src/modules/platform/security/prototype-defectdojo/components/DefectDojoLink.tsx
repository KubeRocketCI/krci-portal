// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { ExternalLink } from "lucide-react";
import { cn } from "@/core/utils/classname";

export interface DefectDojoLinkProps {
  href: string;
  /** Visible text. Without it the link is an icon. */
  children?: React.ReactNode;
  /** Accessible name; names the object the link opens. */
  label: string;
  className?: string;
}

/** Link into the DefectDojo UI, opened in a new tab. DefectDojo's own login decides whether it opens. */
export function DefectDojoLink({ href, children, label, className }: DefectDojoLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (opens DefectDojo in a new tab)`}
      title={label}
      className={cn(
        "text-secondary-dark hover:text-primary focus-visible:ring-ring inline-flex items-center gap-1 rounded text-xs underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none",
        className
      )}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
    </a>
  );
}
