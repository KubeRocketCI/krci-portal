import React from "react";
import { SortState, TableColumn } from "../../types";

export interface TableHeadProps<DataType> {
  columns: TableColumn<DataType>[];
  rowCount: number;
  sort: SortState<DataType>;
  setSort: React.Dispatch<React.SetStateAction<SortState<DataType>>>;
  selectableRowCount?: number;
  selected?: string[];
  handleSelectAllClick?: ((event: React.ChangeEvent<HTMLInputElement>) => void | undefined) | null;
  showExpandColumn?: boolean;
  showSelectionColumn?: boolean;
  /** Rendered inside each `<th>`. Omit to disable resizing. */
  renderColumnResizer?: (columnId: string) => React.ReactNode;
}
