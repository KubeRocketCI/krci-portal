import { RequestError } from "@/core/types/global";
import { GridSpacing } from "@mui/material/Grid/Grid";
import React from "react";

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
