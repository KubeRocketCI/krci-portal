import { TableCellUI, TableRowUI } from "@/core/components/ui/table";
import { CELL_CLASS } from "@/modules/platform/security/components/defectdojo/constants";
import {
  NoScanDataState,
  type NoScanDataStateProps,
} from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { NoCountsCells } from "../NoCountsCells";

/** The row of a level, or of the whole Runtime level, that holds no scan: it names what writes the data. */
export function NoScanDataRow({ producer, what, hint }: Pick<NoScanDataStateProps, "producer" | "what" | "hint">) {
  return (
    <TableRowUI className="hover:bg-transparent">
      <TableCellUI className={CELL_CLASS} />
      <TableCellUI className={CELL_CLASS} colSpan={3}>
        <NoScanDataState producer={producer} what={what} hint={hint} />
      </TableCellUI>
      <NoCountsCells />
    </TableRowUI>
  );
}
