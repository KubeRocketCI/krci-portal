import { TablePagination as TablePaginationComponent } from "@/core/components/ui/table-pagination";
import { PaginationProps } from "./types";

export const Pagination = ({
  dataCount,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
}: PaginationProps) => {
  return (
    <TablePaginationComponent
      dataCount={dataCount}
      page={page}
      rowsPerPage={rowsPerPage}
      handleChangePage={handleChangePage}
      handleChangeRowsPerPage={handleChangeRowsPerPage}
      rowsPerPageOptions={[9, 18, 36, 48, 64, 72]}
      labelRowsPerPage="Cards per page:"
    />
  );
};
