import React from "react";

export const usePagination = ({ initialPage, rowsPerPage }: { rowsPerPage: number; initialPage: number }) => {
  const [page, setPage] = React.useState(initialPage);
  const [rowsPerPageState, setRowsPerPage] = React.useState(rowsPerPage);

  const handleChangePage = React.useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const numRows = parseInt(event.target.value, 10);
    setRowsPerPage(numRows);
    setPage(0);
  }, []);

  return React.useMemo(
    () => ({
      page,
      rowsPerPage: rowsPerPageState,
      handleChangePage,
      handleChangeRowsPerPage,
    }),
    [page, rowsPerPageState, handleChangePage, handleChangeRowsPerPage]
  );
};
