import React from "react";
import { SortOrder, TableColumn } from "../../types";

export interface TableHeadProps<DataType> {
  columns: TableColumn<DataType>[];
  /** Column id of the active sort. Undefined while unsorted. */
  sortBy: string | undefined;
  order: SortOrder;
  onSort: (columnId: string) => void;
  /** Selectable rows on the current page. */
  selectableRowCount?: number;
  /** Selected rows among them. */
  selectedRowCount?: number;
  handleSelectAllClick?: ((event: React.ChangeEvent<HTMLInputElement>) => void | undefined) | null;
  showExpandColumn?: boolean;
  showSelectionColumn?: boolean;
  /** Rendered inside each `<th>`. Omit to disable resizing. */
  renderColumnResizer?: (columnId: string) => React.ReactNode;
}
