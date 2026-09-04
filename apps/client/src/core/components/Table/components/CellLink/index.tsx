import * as React from "react";
import { createLink } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { cn } from "@/core/utils/classname";
import type { CellLinkBaseProps, CellExternalLinkProps } from "./types";

/**
 * The "icon plus name that links somewhere" table cell markup. One look for every name
 * column: the primary-coloured button link. `text` is the only content rendered; any
 * `children` the router passes through `anchorProps` is overridden by the JSX below.
 */
const CellLinkBase = React.forwardRef<HTMLAnchorElement, CellLinkBaseProps>(
  ({ text, icon: Icon, className, ...anchorProps }, ref) => (
    <Button
      data-slot="cell-link"
      variant="link"
      asChild
      className={cn("w-full justify-start p-0 whitespace-normal", className)}
    >
      <a ref={ref} {...anchorProps}>
        {Icon && <Icon className="text-muted-foreground/70 shrink-0" />}
        <TextWithTooltip text={text} />
      </a>
    </Button>
  )
);
CellLinkBase.displayName = "CellLinkBase";

/** Navigates in place. `to` and `params` infer from the registered route tree. */
export const CellLink = createLink(CellLinkBase);

/** Opens `href` in a new tab with `rel="noopener noreferrer"`. */
export function CellExternalLink({ href, ...rest }: CellExternalLinkProps) {
  return <CellLinkBase href={href} target="_blank" rel="noopener noreferrer" {...rest} />;
}
