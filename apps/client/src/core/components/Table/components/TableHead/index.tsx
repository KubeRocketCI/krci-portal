import { Checkbox } from "@/core/components/ui/checkbox";
import { TableHeadUI, TableHeaderUI, TableRowUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import React from "react";
import { SORT_ORDERS, TABLE_CELL_DEFAULTS } from "../../constants";
import { isColumnSortable } from "../../sort";
import { isColumnVisible } from "../../utils";
import { TableHeadProps } from "./types";

/** Centred triangles. The active column shows one; an inactive sortable column shows both, dimmed. */
const ARROW_UP = "M4.5 11.25L9 5.25L13.5 11.25H4.5Z";
const ARROW_DOWN = "M4.5 6.75L9 12.75L13.5 6.75H4.5Z";

export const TableHead = <DataType,>({
  columns,
  sortBy,
  order,
  onSort,
  rowCount,
  selectableRowCount,
  selected,
  handleSelectAllClick,
  showExpandColumn,
  showSelectionColumn,
  renderColumnResizer,
}: TableHeadProps<DataType>) => {
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
        {showExpandColumn && (
          <TableHeadUI className="relative w-10 px-1 py-2 align-bottom">
            {/* Empty header for expand column */}
          </TableHeadUI>
        )}
        {showSelectionColumn && (
          <TableHeadUI className="relative px-1 py-2 align-bottom">
            {!!handleSelectAllClick && !!selectableRowCount && (
              <div className="flex flex-row flex-nowrap items-center justify-center">
                <Checkbox
                  checked={selectedAllIndeterminate ? "indeterminate" : selectAllChecked}
                  onCheckedChange={handleCheckboxChange}
                />
              </div>
            )}
          </TableHeadUI>
        )}
        {columns.map((column) => {
          const { id, label, cell } = column;
          const show = isColumnVisible(column);
          const props = {
            ...TABLE_CELL_DEFAULTS.PROPS,
            ...cell?.props,
          };

          const isSortable = isColumnSortable(column);
          const isActiveSort = isSortable && sortBy === id && order !== SORT_ORDERS.UNSET;
          const isAscending = isActiveSort && order === SORT_ORDERS.ASC;
          // Only the sorted header carries aria-sort; `none` is already a columnheader's default.
          const ariaSort = isActiveSort ? (isAscending ? "ascending" : "descending") : undefined;

          const alignJustifyClass =
            props?.align === "center" ? "justify-center" : props?.align === "right" ? "justify-end" : "justify-start";

          const content = (
            <>
              {isSortable && (
                <svg viewBox="0 0 18 18" width={16} height={16} aria-hidden className="block h-4 w-4 shrink-0">
                  {isActiveSort ? (
                    <path d={isAscending ? ARROW_UP : ARROW_DOWN} className="fill-foreground" />
                  ) : (
                    <>
                      <path d="M5.25 7.5L9 3.75L12.75 7.5H5.25Z" className="fill-muted-foreground" />
                      <path d="M5.25 10.5L9 14.25L12.75 10.5H5.25Z" className="fill-muted-foreground" />
                    </>
                  )}
                </svg>
              )}
              {/* `min-w-0` lets a flex item shrink below its content, so `truncate` can bite at the column floor. */}
              <span
                className={cn(
                  "min-w-0 truncate text-sm",
                  isActiveSort ? "text-foreground font-medium" : "text-muted-foreground font-normal"
                )}
              >
                {label}
              </span>
            </>
          );

          return show ? (
            <TableHeadUI key={id} className="relative px-3 py-2 align-bottom" aria-sort={ariaSort} {...props}>
              {/*
                `overflow-hidden` sits on the label wrapper, not on the `<th>`: the resize
                handle is centred on the column boundary and overhangs it, so clipping the
                cell would cut the handle in half.
              */}
              {isSortable ? (
                <button
                  type="button"
                  onClick={() => onSort(id)}
                  className={`focus-visible:ring-ring flex w-full cursor-pointer flex-row flex-nowrap items-center gap-1 overflow-hidden border-none bg-transparent p-0 outline-none hover:opacity-70 focus-visible:ring-2 ${alignJustifyClass}`}
                >
                  {content}
                </button>
              ) : (
                <div
                  className={`flex w-full flex-row flex-nowrap items-center gap-1 overflow-hidden ${alignJustifyClass}`}
                >
                  {content}
                </div>
              )}
              {renderColumnResizer?.(id)}
            </TableHeadUI>
          ) : null;
        })}
      </TableRowUI>
    </TableHeaderUI>
  );
};
