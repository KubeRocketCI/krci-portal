import React from "react";
import { TableColumn, TableSelection, TableExpandable } from "../../types";

export interface TableBodyProps<DataType = unknown> {
  data: DataType[] | null;
  columns: TableColumn<DataType>[];
  isLoading: boolean;
  blockerError?: Error | null;
  errors?: Error[] | null;
  blockerComponent?: React.ReactNode;
  emptyListComponent?: React.ReactNode;
  handleRowClick?: (event: React.MouseEvent<HTMLTableRowElement>, row: DataType) => void;
  selection?: TableSelection<DataType>;
  expandable?: TableExpandable<DataType>;
  isEmptyFilterResult: boolean;
  page: number;
  rowsPerPage: number;
}
