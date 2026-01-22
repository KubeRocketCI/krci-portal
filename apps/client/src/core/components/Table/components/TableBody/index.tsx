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
  expandable,
  emptyListComponent,
  page,
  rowsPerPage,
  isEmptyFilterResult,
  blockerComponent,
}: TableBodyProps<DataType>) => {
  // Calculate total column span including selection and expandable columns
  const totalColumnSpan = React.useMemo(() => {
    // Count only visible columns (where cell.show !== false)
    const visibleColumnsCount = columns.filter((column) => column.cell.show !== false).length;
    let span = visibleColumnsCount;

    // Add 1 for expandable column if present
    if (expandable) {
      span += 1;
    }

    // Add 1 for selection column if it should be shown
    // Selection column is shown when:
    // - handleSelectRow exists
    // - data exists and has length
    // - not loading
    // - no blocker error/component
    if (
      selection?.handleSelectRow &&
      data !== null &&
      data.length > 0 &&
      !isLoading &&
      !blockerError &&
      !blockerComponent
    ) {
      span += 1;
    }

    return span;
  }, [columns, expandable, selection?.handleSelectRow, data, isLoading, blockerError, blockerComponent]);

  const renderTableBody = React.useCallback(() => {
    if (blockerError) {
      return (
        <TableRowUI>
          <TableCellUI colSpan={totalColumnSpan} className="border-b-0 px-0 pb-0 text-center">
            {/* <ErrorContent error={blockerError} /> */}
          </TableCellUI>
        </TableRowUI>
      );
    }

    if (blockerComponent) {
      return (
        <TableRowUI>
          <TableCellUI colSpan={totalColumnSpan} className="border-b-0 px-0 pb-0 text-center">
            {blockerComponent}
          </TableCellUI>
        </TableRowUI>
      );
    }

    if (isLoading) {
      return (
        <TableRowUI>
          <TableCellUI colSpan={totalColumnSpan} className="border-b-0 px-0 pb-0 text-center">
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
              <TableCellUI colSpan={totalColumnSpan} className="border-b-0 px-0 pb-0 text-center">
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

            const rowId = expandable?.getRowId(row);
            const isExpanded = rowId !== undefined && expandable?.expandedRowIds?.has(rowId);
            const expandedContent = expandable?.expandedRowRender(row);

            return (
              <TableRow
                key={`table-row-${idx}`}
                item={row}
                columns={columns}
                isRowSelected={_isSelected}
                isRowSelectable={_isSelectable}
                handleRowClick={handleRowClick}
                handleSelectRowClick={selection?.handleSelectRow}
                isExpandable={!!expandable}
                isExpanded={isExpanded}
                onToggleExpand={() => {
                  if (!expandable || rowId === undefined) return;

                  const newExpandedIds = new Set<string | number>(expandable.expandedRowIds || new Set());
                  if (newExpandedIds.has(rowId)) {
                    newExpandedIds.delete(rowId);
                  } else {
                    newExpandedIds.add(rowId);
                  }
                  expandable.onExpandedRowsChange?.(newExpandedIds);
                }}
                expandedContent={expandedContent}
              />
            );
          })}
        </>
      );
    }

    if (isEmptyFilterResult) {
      return (
        <TableRowUI>
          <TableCellUI colSpan={totalColumnSpan} className="border-b-0 px-0 pb-0 text-center">
            <EmptyList customText={"No results found!"} isSearch />
          </TableCellUI>
        </TableRowUI>
      );
    }

    return (
      <TableRowUI>
        <TableCellUI colSpan={totalColumnSpan} className="border-b-0 px-0 pb-0 text-center">
          <>{emptyListComponent}</>
        </TableCellUI>
      </TableRowUI>
    );
  }, [
    columns,
    totalColumnSpan,
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
    expandable,
  ]);

  return <TableBodyUI>{renderTableBody()}</TableBodyUI>;
};
