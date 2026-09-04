import * as React from "react";
import type { TextWithTooltipProps } from "@/core/components/TextWithTooltip/types";

/** Anchor props plus the cell-link extras. `href`, `onClick`, etc. arrive from the router via `createLink`. */
export interface CellLinkBaseProps extends React.ComponentPropsWithoutRef<"a"> {
  /** `null`, `undefined` and `""` render the `TextWithTooltip` fallback. */
  text: TextWithTooltipProps["text"];
  /** Leading icon. Rendered muted and `shrink-0`. */
  icon?: React.ComponentType<{ className?: string }>;
}

/** Props of `CellExternalLink`. `target` and `rel` are fixed; other anchor props pass through. */
export type CellExternalLinkProps = Omit<CellLinkBaseProps, "children" | "href" | "target" | "rel"> & {
  href: string;
};
