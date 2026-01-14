import React from "react";
import {
  TableColumn,
  TableSettings as TableSettingsType,
  TableSort,
  TableExpandable,
} from "@/core/components/Table/types";

export interface ServerSideTablePagination {
  show?: boolean;
  page: number; // 0-indexed
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

export interface ServerSideTableProps<DataType = unknown> {
  id: string;
  data: DataType[];
  columns: TableColumn<DataType>[];
  isLoading?: boolean;
  name?: string;
  sort?: TableSort;
  pagination: ServerSideTablePagination;
  settings?: TableSettingsType;
  blockerComponent?: React.ReactNode;
  emptyListComponent?: React.ReactNode;
  blockerError?: Error | null;
  errors?: Error[] | null;
  handleRowClick?: (event: React.MouseEvent<HTMLTableRowElement>, row: DataType) => void;
  expandable?: TableExpandable<DataType>;
  slots?: {
    header?: React.ReactElement;
    footer?: React.ReactElement;
  };
  outlined?: boolean;
}
