import type { ReactNode } from "react";
import { hasActiveFindings, type SeverityCounts } from "@my-project/shared";
import { SeverityCountsRow } from "../SeverityCountsRow";
import { NoFindingsBadge } from "../StateBlocks";

export interface CardLineRowProps {
  /** A scan type, or a report kind of Runtime. */
  name: string;
  /** Beside the name: the scan type, the size of what the line adds up, or both: "3 scans", "Trivy Operator Scan". */
  detail: string;
  counts: Readonly<SeverityCounts>;
  /** Opens the list the line counts. */
  link: ReactNode;
}

/** One scan type or report kind of a level: its own counts, never added to another line. */
export function CardLineRow({ name, detail, counts, link }: CardLineRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded border px-2 py-1.5" data-testid="card-line">
      <span className="text-xs font-medium">{name}</span>
      <span className="text-muted-foreground text-xs">{detail}</span>
      <span className="ml-auto flex flex-wrap items-center gap-3">
        {hasActiveFindings(counts) ? <SeverityCountsRow counts={counts} label={name} /> : <NoFindingsBadge />}
        {link}
      </span>
    </div>
  );
}
