import { Alert, CircularProgress } from "@mui/material";
import React from "react";
import { EmptyList } from "../EmptyList";
import { ErrorContent } from "../ErrorContent";
import { Pagination } from "./components/Pagination";
import { useReadyData } from "./hooks/useReadyData";
import { DataGridProps } from "./types";
import { usePagination } from "./hooks/usePagination";
import { KubeObjectBase } from "@my-project/shared";

export const DataGrid = <DataType = KubeObjectBase,>({
  isLoading,
  blockerError,
  errors,
  spacing,
  renderItem,
  filterFunction,
  data,
  showPagination = true,
  initialPage = 0,
  rowsPerPage = 9,
  emptyListComponent,
}: DataGridProps<DataType>) => {
  const {
    page,
    rowsPerPage: _rowsPerPage,
    handleChangeRowsPerPage,
    handleChangePage,
  } = usePagination({
    initialPage,
    rowsPerPage,
  });

  const readyData = useReadyData<DataType>({
    data,
    filterFunction,
    isLoading: data === null,
    error: blockerError,
  });

  const isReadyDataLoading = readyData === null;

  const hasEmptyResult = React.useMemo(() => {
    if (isLoading && isReadyDataLoading) {
      return false;
    }

    return !!data?.length && !readyData?.length;
  }, [data, isLoading, isReadyDataLoading, readyData]);

  const renderGrid = React.useCallback(() => {
    if (blockerError) {
      return (
        <div className="flex justify-center">
          <ErrorContent error={blockerError} outlined />
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex justify-center">
          <CircularProgress />
        </div>
      );
    }

    if (readyData !== null && readyData.length > 0) {
      return (
        <div className="flex flex-col gap-4">
          <div>
            {errors && !!errors.length && (
              <Alert severity="warning">
                {errors.map((error) => (
                  <div>{error?.message || error?.toString()}</div>
                ))}
              </Alert>
            )}
          </div>
          <div>
            <div className={`grid grid-cols-3 gap-${spacing}`}>
              {readyData.slice(page * _rowsPerPage, page * _rowsPerPage + _rowsPerPage).map((item) => {
                return <div className="col-span-1 h-full">{renderItem(item)}</div>;
              })}
            </div>
          </div>
        </div>
      );
    }

    if (hasEmptyResult) {
      return <EmptyList customText={"No results found!"} isSearch />;
    }

    return <>{emptyListComponent}</>;
  }, [
    blockerError,
    isLoading,
    readyData,
    hasEmptyResult,
    emptyListComponent,
    spacing,
    page,
    _rowsPerPage,
    errors,
    renderItem,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>{renderGrid()}</div>
      {showPagination && data?.length > _rowsPerPage && (
        <div>
          <Pagination
            dataCount={readyData && readyData.length}
            page={page}
            rowsPerPage={_rowsPerPage}
            handleChangePage={handleChangePage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </div>
      )}
    </div>
  );
};
