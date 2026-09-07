import { TablePagination as TablePaginationComponent } from "@/core/components/ui/table-pagination";
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
  const rowsPerPageOptions = JSON.parse(localStorage.getItem("settings") || "{}")?.tableRowsPerPageOptions || [
    10, 20, 25, 50, 100,
  ];

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
