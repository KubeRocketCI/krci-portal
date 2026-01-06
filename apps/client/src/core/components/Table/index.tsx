import React from "react";
import { TableUI } from "@/core/components/ui/table";
import { TableBody } from "./components/TableBody";
import { TableHead } from "./components/TableHead";
import { TablePagination } from "./components/TablePagination";
import { TableSettings } from "./components/TableSettings";
import {
  PAGINATION_DEFAULTS,
  SELECTION_DEFAULTS,
  SORT_DEFAULTS,
  TABLE_CELL_DEFAULTS,
  TABLE_SETTINGS_DEFAULTS,
} from "./constants";
import { useFilteredData } from "./hooks/useFilteredData";
import {
  SortState,
  TablePagination as TablePaginationType,
  TableProps,
  TableSelection,
  TableSettings as TableSettingsType,
  TableSort,
} from "./types";
import { createSortFunction } from "./utils";
import { usePagination } from "./hooks/usePagination";
import { cn } from "@/core/utils/classname";

export const DataTable = <DataType,>({
  id,
  data,
  columns: _columns,
  isLoading = false,
  blockerError,
  errors,
  sort,
  selection,
  pagination,
  emptyListComponent,
  filterFunction,
  handleRowClick,
  blockerComponent,
  slots,
  settings,
  outlined = true,
}: TableProps<DataType>) => {
  const [columns, setColumns] = React.useState(_columns);
  const paginationSettings: TablePaginationType = React.useMemo(
    () => ({
      show: pagination?.show ?? PAGINATION_DEFAULTS.SHOW,
      rowsPerPage: pagination?.rowsPerPage ?? PAGINATION_DEFAULTS.ROWS_PER_PAGE,
      initialPage: pagination?.initialPage ?? PAGINATION_DEFAULTS.INITIAL_PAGE,
      reflectInURL: pagination?.reflectInURL ?? PAGINATION_DEFAULTS.REFLECT_IN_URL,
    }),
    [pagination?.initialPage, pagination?.reflectInURL, pagination?.rowsPerPage, pagination?.show]
  );

  const sortSettings: TableSort = React.useMemo(
    () => ({
      order: sort?.order ?? SORT_DEFAULTS.ORDER,
      sortBy: sort?.sortBy ?? SORT_DEFAULTS.SORT_BY,
    }),
    [sort?.order, sort?.sortBy]
  );

  const selectionSettings: TableSelection<DataType> = React.useMemo(
    () => ({
      selected: selection?.selected ?? [],
      isRowSelectable: selection?.isRowSelectable ?? SELECTION_DEFAULTS.IS_ROW_SELECTABLE,
      isRowSelected: selection?.isRowSelected,
      handleSelectAll: selection?.handleSelectAll,
      handleSelectRow: selection?.handleSelectRow,
      renderSelectionInfo: selection?.renderSelectionInfo,
    }),
    [
      selection?.handleSelectAll,
      selection?.handleSelectRow,
      selection?.isRowSelectable,
      selection?.isRowSelected,
      selection?.renderSelectionInfo,
      selection?.selected,
    ]
  );

  const tableSettings: TableSettingsType = React.useMemo(
    () => ({
      show: settings?.show ?? TABLE_SETTINGS_DEFAULTS.SHOW,
    }),
    [settings?.show]
  );

  const {
    page,
    rowsPerPage: _rowsPerPage,
    handleChangeRowsPerPage,
    handleChangePage,
  } = usePagination({
    initialPage: paginationSettings.initialPage!,
    rowsPerPage: paginationSettings.rowsPerPage!,
  });

  const [sortState, setSortState] = React.useState<SortState<DataType>>({
    order: sortSettings.order,
    sortFn: createSortFunction(sortSettings.order, sortSettings.sortBy),
    sortBy: sortSettings.sortBy,
  });

  const filteredData = useFilteredData<DataType>({
    data,
    isLoading,
    error: blockerError,
    filterFunction,
    sort: sortState,
  });

  const isFilteredDataLoading = filteredData === null;

  const isEmptyFilterResult = React.useMemo(() => {
    if (isLoading && isFilteredDataLoading) {
      return false;
    }

    return !!data?.length && !filteredData?.length;
  }, [data, isLoading, isFilteredDataLoading, filteredData]);

  const activePage = filteredData !== null && filteredData.length < _rowsPerPage ? 0 : page;

  const paginatedData = React.useMemo(() => {
    if (!filteredData) {
      return {
        items: [],
        count: 0,
      };
    }

    const items = filteredData.slice(page * _rowsPerPage, page * _rowsPerPage + _rowsPerPage);

    return {
      items,
      count: items?.length,
    };
  }, [page, filteredData, _rowsPerPage]);

  const selectableRowCount = React.useMemo(
    () => selectionSettings.isRowSelectable && paginatedData.items.filter(selectionSettings.isRowSelectable).length,
    [paginatedData.items, selectionSettings.isRowSelectable]
  );

  const validSelectedCount = React.useMemo(() => {
    if (!selectionSettings.selected?.length || !data?.length || !selectionSettings.isRowSelected) {
      return selectionSettings.selected?.length || 0;
    }

    return data.filter((item) => selectionSettings.isRowSelected?.(item)).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionSettings.selected, selectionSettings.isRowSelected, data]);

  const validSelected = React.useMemo(
    () => (validSelectedCount > 0 ? Array(validSelectedCount).fill("") : []),
    [validSelectedCount]
  );

  const _handleSelectAllClick = React.useMemo(() => {
    if (!selectionSettings.handleSelectAll || !filteredData || !filteredData.length) {
      return null;
    }

    return (event: React.ChangeEvent<HTMLInputElement>) =>
      selectionSettings.handleSelectAll?.(event, paginatedData.items);
  }, [selectionSettings, filteredData, paginatedData.items]);

  const shouldShowSelectionColumn = React.useMemo(() => {
    // Only show selection column when we have actual data rows to display
    // Don't show it for empty states, loading, or errors
    if (!selectionSettings.handleSelectRow) {
      return false;
    }
    if (isLoading || isFilteredDataLoading) {
      return false;
    }
    if (blockerError || blockerComponent) {
      return false;
    }
    if (filteredData === null || filteredData.length === 0) {
      return false;
    }
    return true;
  }, [
    selectionSettings.handleSelectRow,
    isLoading,
    isFilteredDataLoading,
    blockerError,
    blockerComponent,
    filteredData,
  ]);

  const renderHeader = React.useCallback(() => {
    if (slots?.header || tableSettings.show) {
      return (
        <div className="px-5 pt-5">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4">
            <div className="grid grid-cols-12 gap-4">{slots?.header}</div>
            <div className="mt-6">
              {tableSettings.show && <TableSettings id={id} columns={columns} setColumns={setColumns} />}
            </div>
          </div>
        </div>
      );
    }
  }, [slots?.header, tableSettings.show, id, columns, setColumns]);

  return (
    <div className={`bg-background w-full text-sm ${outlined ? "rounded-md shadow-sm" : ""}`}>
      <div className="flex flex-col gap-2">
        {renderHeader()}
        <div className={cn(outlined ? "px-5" : "", "py-5")}>
          {selectionSettings.renderSelectionInfo && validSelected.length > 0 && (
            <div className="bg-muted flex items-center justify-between px-5">
              <div className="py-4">{selectionSettings.renderSelectionInfo(validSelected.length)}</div>
            </div>
          )}
          <div className="border-border w-full overflow-hidden rounded-md border">
            <TableUI>
              <colgroup>
                {shouldShowSelectionColumn && <col key={"select-checkbox"} width={`${TABLE_CELL_DEFAULTS.WIDTH}%`} />}
                {columns.map(
                  (column) => column.cell.show !== false && <col key={column.id} width={`${column.cell.baseWidth}%`} />
                )}
              </colgroup>

              <TableHead
                columns={columns}
                sort={sortState}
                setSort={setSortState}
                rowCount={paginatedData?.count}
                selectableRowCount={selectableRowCount}
                selected={validSelected}
                handleSelectAllClick={_handleSelectAllClick}
              />
              <TableBody
                columns={columns}
                data={filteredData}
                blockerError={blockerError}
                errors={errors}
                isLoading={isLoading}
                selection={selectionSettings}
                handleRowClick={handleRowClick}
                emptyListComponent={emptyListComponent}
                page={activePage}
                rowsPerPage={_rowsPerPage}
                isEmptyFilterResult={isEmptyFilterResult}
                blockerComponent={blockerComponent}
              />
            </TableUI>
          </div>
        </div>
        {paginationSettings.show && (
          <div className="m-0 px-5 pb-5">
            <TablePagination
              dataCount={filteredData && filteredData.length}
              page={activePage}
              rowsPerPage={_rowsPerPage}
              handleChangePage={handleChangePage}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
            />
          </div>
        )}
        {slots?.footer && slots.footer}
      </div>
    </div>
  );
};
