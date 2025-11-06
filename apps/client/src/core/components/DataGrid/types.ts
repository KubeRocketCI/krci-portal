import { RequestError } from "@/core/types/global";
import React from "react";

export type GridSpacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface DataGridProps<DataType = unknown> {
  isLoading: boolean;
  spacing: GridSpacing;
  renderItem: (item: DataType) => React.ReactElement;
  data: DataType[];
  blockerError?: RequestError;
  errors?: RequestError[] | null;
  filterFunction?: (el: DataType) => boolean;
  showPagination?: boolean;
  initialPage?: number;
  rowsPerPage?: number;
  emptyListComponent?: React.ReactNode;
}
