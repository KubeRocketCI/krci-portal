import { Alert } from "@/core/components/ui/alert";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import React from "react";
import { TableBodyUI, TableCellUI, TableRowUI } from "@/core/components/ui/table";
import { TableRow } from "./components/TableRow";
import { TableBodyProps } from "./types";
import { EmptyList } from "@/core/components/EmptyList";

const isSelectedRow = <DataType,>(isSelected: (row: DataType) => boolean, row: DataType) =>
  isSelected ? isSelected(row) : false;

export const TableBody = <DataType,>({
  blockerError,
  errors,
  isLoading,
  columns,
  data,
  handleRowClick,
  selection,
  emptyListComponent,
  page,
  rowsPerPage,
  isEmptyFilterResult,
  blockerComponent,
}: TableBodyProps<DataType>) => {
  const renderTableBody = React.useCallback(() => {
    const columnsLength = columns.length;

    if (blockerError) {
      return (
        <TableRowUI>
          <TableCellUI colSpan={columnsLength} className="text-center px-0 pb-0 border-b-0">
            {/* <ErrorContent error={blockerError} /> */}
          </TableCellUI>
        </TableRowUI>
      );
    }

    if (blockerComponent) {
      return (
        <TableRowUI>
          <TableCellUI colSpan={columnsLength} className="text-center px-0 pb-0 border-b-0">
            {blockerComponent}
          </TableCellUI>
        </TableRowUI>
      );
    }

    if (isLoading) {
      return (
        <TableRowUI>
          <TableCellUI colSpan={columnsLength} className="text-center px-0 pb-0 border-b-0">
            <LoadingSpinner />
          </TableCellUI>
        </TableRowUI>
      );
    }

    if (data !== null && data?.length && !isLoading) {
      return (
        <>
          {errors && !!errors.length && (
            <TableRowUI>
              <TableCellUI colSpan={columnsLength} className="text-center px-0 pb-0 border-b-0">
                <Alert variant="default">
                  {errors.map((error, index) => (
                    <div key={index}>{error?.message || error?.toString()}</div>
                  ))}
                </Alert>
              </TableCellUI>
            </TableRowUI>
          )}
          {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx: number) => {
            const _isSelected = selection?.isRowSelected ? isSelectedRow(selection.isRowSelected, row) : false;
            const _isSelectable = selection?.isRowSelectable ? selection?.isRowSelectable(row) : true;

            return (
              <TableRow
                key={`table-row-${idx}`}
                item={row}
                columns={columns}
                isRowSelected={_isSelected}
                isRowSelectable={_isSelectable}
                handleRowClick={handleRowClick}
                handleSelectRowClick={selection?.handleSelectRow}
              />
            );
          })}
        </>
      );
    }

    if (isEmptyFilterResult) {
      return (
        <TableRowUI>
          <TableCellUI colSpan={columnsLength} className="text-center px-0 pb-0 border-b-0">
            <EmptyList customText={"No results found!"} isSearch />
          </TableCellUI>
        </TableRowUI>
      );
    }

    return (
      <TableRowUI>
        <TableCellUI colSpan={columnsLength} className="text-center px-0 pb-0 border-b-0">
          <>{emptyListComponent}</>
        </TableCellUI>
      </TableRowUI>
    );
  }, [
    columns,
    blockerError,
    blockerComponent,
    isLoading,
    data,
    isEmptyFilterResult,
    emptyListComponent,
    errors,
    page,
    rowsPerPage,
    selection,
    handleRowClick,
  ]);

  return <TableBodyUI>{renderTableBody()}</TableBodyUI>;
};
