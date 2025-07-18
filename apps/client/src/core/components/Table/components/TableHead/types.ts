import React from "react";
import { SortState, TableColumn } from "../../types";

export interface TableHeadProps<DataType> {
  tableId: string;
  columns: TableColumn<DataType>[];
  colGroupRef: React.MutableRefObject<HTMLTableColElement | null>;
  rowCount: number;
  sort: SortState<DataType>;
  setSort: React.Dispatch<React.SetStateAction<SortState<DataType>>>;
  selectableRowCount?: number;
  selected?: string[];
  handleSelectAllClick?: ((event: React.ChangeEvent<HTMLInputElement>) => void | undefined) | null;
  minimal?: boolean;
}
