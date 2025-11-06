import { TablePagination as TablePaginationComponent } from "@/core/components/ui/table-pagination";
import { TablePaginationProps } from "./types";

export const TablePagination = ({
  dataCount,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
}: TablePaginationProps) => {
  const rowsPerPageOptions =
    JSON.parse(localStorage.getItem("settings") || "{}")?.tableRowsPerPageOptions || [10, 20, 50, 100];

  return (
    <TablePaginationComponent
      dataCount={dataCount}
      page={page}
      rowsPerPage={rowsPerPage}
      handleChangePage={handleChangePage}
      handleChangeRowsPerPage={handleChangeRowsPerPage}
      rowsPerPageOptions={rowsPerPageOptions}
    />
  );
};
