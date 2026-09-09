import React from "react";
import { TablePagination as TablePaginationComponent } from "@/core/components/ui/table-pagination";
import { getRowsPerPageOptions } from "@/core/services/table-preferences";
import { TablePaginationProps } from "./types";

export const TablePagination = ({
  totalCount,
  hasNextPage,
  pageItemCount,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  showRowsPerPage,
}: TablePaginationProps) => {
  // Nothing writes the options field, so a re-read yields the same list.
  const rowsPerPageOptions = React.useMemo(getRowsPerPageOptions, []);

  return (
    <TablePaginationComponent
      totalCount={totalCount}
      hasNextPage={hasNextPage}
      pageItemCount={pageItemCount}
      page={page}
      rowsPerPage={rowsPerPage}
      handleChangePage={handleChangePage}
      handleChangeRowsPerPage={handleChangeRowsPerPage}
      rowsPerPageOptions={rowsPerPageOptions}
      showRowsPerPage={showRowsPerPage}
    />
  );
};
