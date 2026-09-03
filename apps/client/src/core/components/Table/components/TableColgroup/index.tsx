import React from "react";
import { TABLE_WIDTH_DEFAULTS } from "../../constants";
import { TableColgroupProps } from "./types";

/**
 * Single source of column geometry for both table shells. `<col>` order must match
 * `TableHead`'s `<th>` order. Every visible data column has an explicit width; there is
 * no auto-width last column.
 */
const TableColgroupComponent = <DataType,>({
  columns,
  getColProps,
  showExpandColumn,
  showSelectionColumn,
}: TableColgroupProps<DataType>) => (
  <colgroup>
    {showExpandColumn && <col style={{ width: TABLE_WIDTH_DEFAULTS.EXPAND_COLUMN }} />}
    {showSelectionColumn && <col style={{ width: TABLE_WIDTH_DEFAULTS.SELECTION_COLUMN }} />}
    {columns
      .filter((column) => column.cell.show !== false)
      .map((column) => (
        <col key={column.id} {...getColProps(column.id)} />
      ))}
  </colgroup>
);

/**
 * Memoised: a re-render mid-drag must not reconcile `<col>` widths the drag writes
 * imperatively. `getColProps` is stable during a drag and changes on commit, reset and
 * re-seed.
 */
export const TableColgroup = React.memo(TableColgroupComponent) as typeof TableColgroupComponent;
