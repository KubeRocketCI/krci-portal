import React from "react";

export interface PaginationProps {
  totalCount: number | undefined;
  pageItemCount: number;
  rowsPerPage: number;
  page: number;
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
