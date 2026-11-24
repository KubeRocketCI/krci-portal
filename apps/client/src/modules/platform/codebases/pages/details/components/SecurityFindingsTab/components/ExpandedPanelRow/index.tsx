import type { ReactNode } from "react";
import { TableCellUI, TableRowUI } from "@/core/components/ui/table";
import { COLUMN_COUNT } from "../../constants";

export interface ExpandedPanelRowProps {
  /** The `aria-controls` of the button that opens the row. */
  id: string;
  children: ReactNode;
}

export function ExpandedPanelRow({ id, children }: ExpandedPanelRowProps) {
  return (
    <TableRowUI id={id} className="hover:bg-transparent">
      <TableCellUI className="bg-muted/30 p-3" colSpan={COLUMN_COUNT}>
        {children}
      </TableCellUI>
    </TableRowUI>
  );
}
