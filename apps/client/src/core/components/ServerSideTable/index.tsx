import React from "react";
import { TableUI } from "@/core/components/ui/table";
import { TableBody } from "@/core/components/Table/components/TableBody";
import { TableHead } from "@/core/components/Table/components/TableHead";
import { TablePagination } from "@/core/components/Table/components/TablePagination";
import { TableSettings } from "@/core/components/Table/components/TableSettings";
import { SORT_DEFAULTS, TABLE_SETTINGS_DEFAULTS } from "@/core/components/Table/constants";
import { SortState, TableSort } from "@/core/components/Table/types";
import { createSortFunction } from "@/core/components/Table/utils";
import { cn } from "@/core/utils/classname";
import { ServerSideTableProps } from "./types";

/**
 * ServerSideTable component for tables with server-side pagination
 *
 * Features:
 * - Server-side pagination (data fetched per page)
 * - Client-side sorting (on current page data)
 * - Column visibility settings (persisted to localStorage)
 * - Traditional pagination UI (First/Prev/Next/Last, page numbers)
 *
 * Use this instead of DataTable when:
 * - Data is paginated on the server (API returns pageSize items + totalCount)
 * - You want traditional page navigation (not "Load More")
 * - Server handles filtering/searching
 *
 * @example
 * <ServerSideTable
 *   id="projects-table"
 *   data={currentPageData}
 *   columns={columns}
 *   pagination={{
 *     show: true,
 *     page: 0,
 *     rowsPerPage: 25,
 *     totalCount: 150,
 *     onPageChange: (page) => setPage(page),
 *     onRowsPerPageChange: (size) => setPageSize(size),
 *   }}
 * />
 */
export const ServerSideTable = <DataType,>({
  id,
  data,
  columns: _columns,
  isLoading = false,
  blockerError,
  errors,
  sort,
  pagination,
  emptyListComponent,
  handleRowClick,
  expandable,
  blockerComponent,
  slots,
  settings,
  outlined = true,
}: ServerSideTableProps<DataType>) => {
  const [columns, setColumns] = React.useState(_columns);

  const sortSettings: TableSort = React.useMemo(
    () => ({
      order: sort?.order ?? SORT_DEFAULTS.ORDER,
      sortBy: sort?.sortBy ?? SORT_DEFAULTS.SORT_BY,
    }),
    [sort?.order, sort?.sortBy]
  );

  const tableSettings = React.useMemo(
    () => ({
      show: settings?.show ?? TABLE_SETTINGS_DEFAULTS.SHOW,
    }),
    [settings?.show]
  );

  const [sortState, setSortState] = React.useState<SortState<DataType>>({
    order: sortSettings.order,
    sortFn: createSortFunction(sortSettings.order, sortSettings.sortBy),
    sortBy: sortSettings.sortBy,
  });

  // Check if current page is beyond total pages
  const isPageOutOfBounds = React.useMemo(() => {
    if (!pagination.show || pagination.totalCount === 0) {
      return false;
    }
    const totalPages = Math.ceil(pagination.totalCount / pagination.rowsPerPage);
    return pagination.page >= totalPages;
  }, [pagination]);

  // Sort data client-side (sorting current page only)
  const sortedData = React.useMemo(() => {
    if (!data || isLoading) {
      return null;
    }

    if (blockerError) {
      return null;
    }

    // If page is out of bounds, return empty array to show empty state
    if (isPageOutOfBounds) {
      return [];
    }

    return [...data].sort(sortState.sortFn);
  }, [data, isLoading, blockerError, sortState.sortFn, isPageOutOfBounds]);

  const renderHeader = React.useCallback(() => {
    if (slots?.header || tableSettings.show) {
      return (
        <div className={cn(outlined ? "px-5" : "", "pt-5")}>
          <div className="grid grid-cols-[1fr_auto] items-center gap-4">
            <div className="grid grid-cols-12 gap-4">{slots?.header}</div>
            <div className="mt-6">
              {tableSettings.show && <TableSettings id={id} columns={columns} setColumns={setColumns} />}
            </div>
          </div>
        </div>
      );
    }
  }, [slots?.header, tableSettings.show, id, columns, setColumns, outlined]);

  // Wrap pagination callbacks to convert types
  const handleChangePage = React.useCallback(
    (_event: unknown, newPage: number) => {
      pagination.onPageChange(newPage);
    },
    [pagination]
  );

  const handleChangeRowsPerPage = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numRows = parseInt(event.target.value, 10);
      pagination.onRowsPerPageChange(numRows);
      // Reset to first page when changing rows per page
      pagination.onPageChange(0);
    },
    [pagination]
  );

  return (
    <div className={`bg-background w-full text-sm ${outlined ? "rounded-md shadow-sm" : ""}`}>
      <div className="flex flex-col gap-2">
        {renderHeader()}
        <div className={cn(outlined ? "px-5" : "", "py-5")}>
          <div className="border-border w-full overflow-hidden rounded-md border">
            <TableUI>
              <colgroup>
                {expandable && <col key={"expand-chevron"} width="40px" />}
                {columns.map(
                  (column) => column.cell.show !== false && <col key={column.id} width={`${column.cell.baseWidth}%`} />
                )}
              </colgroup>

              <TableHead
                columns={columns}
                sort={sortState}
                setSort={setSortState}
                rowCount={sortedData?.length || 0}
                selectableRowCount={0}
                selected={[]}
                handleSelectAllClick={null}
                showExpandColumn={!!expandable}
              />
              <TableBody
                columns={columns}
                data={sortedData}
                blockerError={blockerError}
                errors={errors}
                isLoading={isLoading}
                selection={{
                  selected: [],
                  isRowSelectable: () => false,
                }}
                expandable={expandable}
                handleRowClick={handleRowClick}
                emptyListComponent={
                  isPageOutOfBounds ? (
                    <div className="text-muted-foreground py-8 text-center">
                      <p className="mb-2 text-lg font-medium">Page not found</p>
                      <p className="text-sm">The requested page does not exist. Please navigate to a valid page.</p>
                    </div>
                  ) : (
                    emptyListComponent
                  )
                }
                page={0} // Server-side: always show from start of current page data
                rowsPerPage={data?.length || 0}
                isEmptyFilterResult={false}
                blockerComponent={blockerComponent}
              />
            </TableUI>
          </div>
        </div>
        {pagination.show && (
          <div className="m-0 px-5 pb-5">
            <TablePagination
              dataCount={pagination.totalCount}
              page={pagination.page}
              rowsPerPage={pagination.rowsPerPage}
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
