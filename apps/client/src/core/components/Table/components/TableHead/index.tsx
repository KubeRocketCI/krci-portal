import { Checkbox } from "@/core/components/ui/checkbox";
import { TableHeadUI, TableHeaderUI, TableRowUI } from "@/core/components/ui/table";
import React from "react";
import { SORT_ORDERS, TABLE_CELL_DEFAULTS } from "../../constants";
import { TableColumn } from "../../types";
import { createCustomSortFunction, createSortFunction, getSortOrder, isAsc, isDesc } from "../../utils";
import { TableHeadProps } from "./types";

export const TableHead = <DataType,>({
  columns,
  sort,
  setSort,
  rowCount,
  selectableRowCount,
  selected,
  handleSelectAllClick,
}: TableHeadProps<DataType>) => {
  const handleRequestSort = (column: TableColumn<DataType>) => {
    const _isDesc = isDesc(column.id, sort.sortBy, sort.order);
    const _isAsc = isAsc(column.id, sort.sortBy, sort.order);
    const newSortOrder = getSortOrder(_isDesc, _isAsc);

    setSort({
      order: newSortOrder,
      sortFn: column.data.columnSortableValuePath
        ? createSortFunction(newSortOrder, column.data.columnSortableValuePath)
        : createCustomSortFunction(newSortOrder, column.data.customSortFn),
      sortBy: column.id,
    });
  };

  const selectedLength = React.useMemo(() => selected?.length, [selected]);

  const selectedAllIndeterminate = !!selectedLength && selectedLength > 0 && selectedLength < rowCount;
  const selectAllChecked = selectedLength === selectableRowCount || selectedLength === rowCount;

  const handleCheckboxChange = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_checked: boolean) => {
      if (typeof handleSelectAllClick === "function") {
        const shouldSelectAll = !selectAllChecked;
        handleSelectAllClick({ target: { checked: shouldSelectAll } } as React.ChangeEvent<HTMLInputElement>);
      }
    },
    [handleSelectAllClick, selectAllChecked]
  );

  return (
    <TableHeaderUI className="bg-muted">
      <TableRowUI>
        {!!handleSelectAllClick && !!selectableRowCount && (
          <TableHeadUI className="relative px-1 py-2 align-bottom">
            <div className="flex flex-row flex-nowrap items-center justify-center">
              <Checkbox
                checked={selectedAllIndeterminate ? "indeterminate" : selectAllChecked}
                onCheckedChange={handleCheckboxChange}
              />
            </div>
          </TableHeadUI>
        )}
        {columns.map((column) => {
          const { id, label, data, cell } = column;
          const show = cell?.show ?? TABLE_CELL_DEFAULTS.SHOW;
          const props = {
            ...TABLE_CELL_DEFAULTS.PROPS,
            ...cell?.props,
          };

          const activeColumnSort = sort.sortBy === id;
          const isAscending = activeColumnSort && sort.order === SORT_ORDERS.ASC;
          const isDescending = activeColumnSort && sort.order === SORT_ORDERS.DESC;

          const alignJustifyClass =
            props?.align === "center" ? "justify-center" : props?.align === "right" ? "justify-end" : "justify-start";

          const isSortable = !!data?.columnSortableValuePath || !!data?.customSortFn;

          const content = (
            <>
              {isSortable && (
                <svg viewBox="0 0 18 18" width={16} height={16} className="block h-4 w-4 shrink-0">
                  <path
                    d="M5.25 6L9 2.25L12.75 6H5.25Z"
                    className={isAscending ? "fill-foreground" : "fill-muted-foreground"}
                  />
                  <path
                    d="M5.25 12L9 15.75L12.75 12H5.25Z"
                    className={isDescending ? "fill-foreground" : "fill-muted-foreground"}
                  />
                </svg>
              )}
              <span className="text-muted-foreground text-sm font-normal">{label}</span>
            </>
          );

          return show ? (
            <TableHeadUI key={id} className="relative px-3 py-2 align-bottom" {...props}>
              {isSortable ? (
                <button
                  type="button"
                  onClick={() => handleRequestSort(column)}
                  className={`focus-visible:ring-ring flex cursor-pointer flex-row flex-nowrap items-center gap-1 border-none bg-transparent p-0 outline-none hover:opacity-70 focus-visible:ring-2 ${alignJustifyClass}`}
                >
                  {content}
                </button>
              ) : (
                <div className={`flex flex-row flex-nowrap items-center gap-1 ${alignJustifyClass}`}>{content}</div>
              )}
            </TableHeadUI>
          ) : null;
        })}
      </TableRowUI>
    </TableHeaderUI>
  );
};
