import type { ReactNode } from "react";
import { TableCellUI } from "@/core/components/ui/table";
import { CELL_CLASS } from "../../constants";

export interface NameCellProps {
  /** What the row is: the scanner of a scan, the container of a container row. */
  name: string;
  badges?: ReactNode;
  /** The second line: the target of a scan, the workload of a container, with their badges. */
  detail: ReactNode;
}

export function NameCell({ name, badges, detail }: NameCellProps) {
  return (
    <TableCellUI className={CELL_CLASS}>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium break-all">{name}</span>
          {badges}
        </span>
        <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs break-all">{detail}</span>
      </div>
    </TableCellUI>
  );
}
