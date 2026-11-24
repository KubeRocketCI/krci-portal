import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";

interface SectionHeadingProps {
  /** For `aria-labelledby` on the section. */
  id?: string;
  /** Tooltip text of an Info button next to the heading; the button is outside the heading's accessible name. */
  hint?: string;
  children: ReactNode;
}

const HEADING_CLASS = "text-muted-foreground text-xs font-semibold tracking-wide uppercase";

export function SectionHeading({ id, hint, children }: SectionHeadingProps) {
  if (!hint) {
    return (
      <h2 id={id} className={cn(HEADING_CLASS, "mb-2")}>
        {children}
      </h2>
    );
  }

  return (
    <div className="mb-2 flex items-center gap-1">
      <h2 id={id} className={HEADING_CLASS}>
        {children}
      </h2>
      <Tooltip title={hint}>
        <button
          type="button"
          aria-label={typeof children === "string" ? `About ${children}` : "About this section"}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex rounded-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <Info size={16} aria-hidden />
        </button>
      </Tooltip>
    </div>
  );
}
