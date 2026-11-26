import { DEFECTDOJO_SEVERITIES, type SeverityCounts } from "@my-project/shared";
import { TableCellUI, TableHeadUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import { SeverityCountBadge } from "@/modules/platform/security/components/shared/SeverityCountBadge";
import { CELL_CLASS, HEAD_CLASS } from "../constants";

export interface SeverityCountCellsProps {
  /** Active findings by severity. `null`: there are no counts, shown as dashes and never as zeros. */
  counts: Readonly<SeverityCounts> | null;
  /** Why there are no counts, for the accessible name of a dash: "no scan data", "not running". */
  missing?: string;
}

/** A table cell per severity, in the order of the column headers of the scans table. */
export function SeverityCountCells({ counts, missing = "no scan data" }: SeverityCountCellsProps) {
  return (
    <>
      {DEFECTDOJO_SEVERITIES.map((severity) => (
        <TableCellUI key={severity} className={cn(CELL_CLASS, "text-center")}>
          <SeverityCountBadge
            severity={severity}
            count={counts ? counts[severity] : null}
            ariaLabel={`${severity}: ${counts ? counts[severity] : missing}`}
          />
        </TableCellUI>
      ))}
    </>
  );
}

export function SeverityHeadCells() {
  return (
    <>
      {DEFECTDOJO_SEVERITIES.map((severity) => (
        <TableHeadUI key={severity} scope="col" className={cn(HEAD_CLASS, "w-16 text-center")}>
          {severity}
        </TableHeadUI>
      ))}
    </>
  );
}
