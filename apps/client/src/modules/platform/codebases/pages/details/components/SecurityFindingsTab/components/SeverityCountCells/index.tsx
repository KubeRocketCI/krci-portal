import { DEFECTDOJO_SEVERITIES, type DefectDojoSeverity } from "@my-project/shared";
import { TableCellUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import { NO_VALUE } from "@/modules/platform/security/components/defectdojo/constants";
import { SeverityCountBadge } from "@/modules/platform/security/components/shared/SeverityCountBadge";
import { CELL_CLASS } from "../../constants";

export interface SeverityCountCellsProps {
  /** Active findings by severity. `null`: there are no counts, shown as dashes and never as zeros. */
  counts: Readonly<Record<DefectDojoSeverity, number>> | null;
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

export interface NoCountsCellsProps {
  missing?: string;
}

/** The cells of a row without counts: a dash per severity, a dash each for triaged and last upload, an empty link cell. */
export function NoCountsCells({ missing }: NoCountsCellsProps) {
  return (
    <>
      <SeverityCountCells counts={null} missing={missing} />
      <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-center text-xs")}>{NO_VALUE}</TableCellUI>
      <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>{NO_VALUE}</TableCellUI>
      <TableCellUI className={CELL_CLASS} />
    </>
  );
}
