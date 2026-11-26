import { TableCellUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import { CELL_CLASS, NO_VALUE } from "@/modules/platform/security/components/defectdojo/constants";
import { SeverityCountCells } from "@/modules/platform/security/components/defectdojo/SeverityCountCells";

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
