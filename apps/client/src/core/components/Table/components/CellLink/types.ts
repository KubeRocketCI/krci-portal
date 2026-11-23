import * as React from "react";
import type { TextWithTooltipProps } from "@/core/components/TextWithTooltip/types";

/** Anchor props plus the cell-link extras. `href`, `onClick`, etc. arrive from the router via `createLink`. */
export interface CellLinkBaseProps extends React.ComponentPropsWithoutRef<"a"> {
  /** `null`, `undefined` and `""` render the `TextWithTooltip` fallback. */
  text: TextWithTooltipProps["text"];
  /** Leading icon. Rendered muted and `shrink-0`. */
  icon?: CellLinkIcon;
  /** Renders the icon alone and no text. `CellExternalLink` demands an `aria-label` for it. */
  iconOnly?: boolean;
}

type CellLinkIcon = React.ComponentType<{ className?: string }>;

type CellExternalLinkAnchorProps = Omit<
  CellLinkBaseProps,
  "children" | "href" | "target" | "rel" | "text" | "icon" | "iconOnly"
> & { href: string };

/**
 * Props of `CellExternalLink`. `target` and `rel` are fixed; other anchor props pass through.
 * A link is named by its `text`; an icon-only link has no text, so it is named by its `aria-label`.
 */
export type CellExternalLinkProps = CellExternalLinkAnchorProps &
  (
    | { text: CellLinkBaseProps["text"]; icon?: CellLinkIcon; iconOnly?: never }
    | { iconOnly: true; icon: CellLinkIcon; "aria-label": string; text?: never }
  );
