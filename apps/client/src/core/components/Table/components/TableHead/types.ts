import React from "react";
import { SortOrder, TableColumn } from "../../types";

export interface TableHeadProps<DataType> {
  columns: TableColumn<DataType>[];
  rowCount: number;
  /** Column id of the active sort. Undefined while unsorted. */
  sortBy: string | undefined;
  order: SortOrder;
  onSort: (columnId: string) => void;
  selectableRowCount?: number;
  selected?: string[];
  handleSelectAllClick?: ((event: React.ChangeEvent<HTMLInputElement>) => void | undefined) | null;
  showExpandColumn?: boolean;
  showSelectionColumn?: boolean;
  /** Rendered inside each `<th>`. Omit to disable resizing. */
  renderColumnResizer?: (columnId: string) => React.ReactNode;
}
