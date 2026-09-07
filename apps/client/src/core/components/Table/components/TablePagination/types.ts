import React from "react";

export interface TablePaginationProps {
  totalCount: number | undefined;
  hasNextPage?: boolean;
  pageItemCount: number;
  rowsPerPage: number;
  page: number;
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Defaults to `true` in the ui pager. */
  showRowsPerPage?: boolean;
}
