import { Checkbox } from "@/core/components/ui/checkbox";
import { TableHeadUI, TableHeaderUI, TableRowUI } from "@/core/components/ui/table";
import React from "react";
import { SORT_ORDERS, TABLE_CELL_DEFAULTS } from "../../constants";
import { TableColumn } from "../../types";
import { createCustomSortFunction, createSortFunction, getSortOrder, isAsc, isDesc } from "../../utils";
import { useTableSettings } from "../TableSettings/hooks/useTableSettings";
import { SavedTableSettings } from "../TableSettings/types";
import { TableHeadProps } from "./types";

export const TableHead = <DataType,>({
  tableId,
  columns,
  colGroupRef,
  sort,
  setSort,
  rowCount,
  selectableRowCount,
  selected,
  handleSelectAllClick,
}: TableHeadProps<DataType>) => {
  const { loadSettings, saveSettings } = useTableSettings(tableId);

  const tableSettings = loadSettings();

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

  const saveNewColumnsWidth = React.useCallback(() => {
    if (!tableSettings) return;
    const colGroup = colGroupRef.current;
    const cols = (colGroup ? Array.from(colGroup.children) : []) as HTMLTableColElement[];

    const newSettings = columns.reduce<SavedTableSettings>((acc, cur) => {
      acc[cur.id] = {
        ...tableSettings[cur.id],
        width: parseFloat(cols.find((col) => col.dataset.id === cur.id)?.getAttribute("width") || ""),
      };

      return acc;
    }, {});

    saveSettings(newSettings);
  }, [colGroupRef, columns, saveSettings, tableSettings]);

  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>, resizableColumnId: string) => {
      event.preventDefault();

      const resizerElement = event.target as HTMLElement;

      if (!resizerElement) return;

      resizerElement.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
      document.body.style.cursor = "col-resize";

      const startX = event.clientX;
      const colGroup = colGroupRef.current;
      const cols = (colGroup ? Array.from(colGroup.children) : []) as HTMLTableColElement[];
      const targetCol = cols.find((col) => col.dataset.id === resizableColumnId);

      if (!targetCol) return;

      let nextColIndex = cols.indexOf(targetCol) + 1;
      let nextCol = null;
      while (nextColIndex < cols.length) {
        const potentialNextCol = cols[nextColIndex];
        const nextColumnData = columns.find((col) => col.id === potentialNextCol.dataset.id);
        if (nextColumnData && nextColumnData.cell.show !== false) {
          nextCol = potentialNextCol;
          break;
        }
        nextColIndex++;
      }

      if (!nextCol) return;

      const originalWidth = targetCol.offsetWidth;
      const nextOriginalWidth = nextCol.offsetWidth;
      const tableWidth = colGroup?.parentElement?.offsetWidth;

      const handleMouseMove = (moveEvent: Event | React.MouseEvent) => {
        if (!tableWidth) {
          return;
        }

        const deltaX = (moveEvent as React.MouseEvent).clientX - startX;

        const column = columns.find((col) => col.id === resizableColumnId);
        const nextColumn = columns.find((col) => col.id === nextCol.dataset.id);
        if (!column || column.cell.isFixed || !nextColumn || nextColumn.cell.isFixed) return;

        const newWidth = originalWidth + deltaX;
        const newNextWidth = nextOriginalWidth - deltaX;

        if (newWidth + newNextWidth <= tableWidth) {
          const newTargetColWidth = `${((newWidth / tableWidth) * 100).toFixed(3)}%`;
          const newNextColWidth = `${((newNextWidth / tableWidth) * 100).toFixed(3)}%`;

          targetCol.setAttribute("width", newTargetColWidth);
          nextCol.setAttribute("width", newNextColWidth);
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        resizerElement.style = "";
        document.body.style.cursor = "";
        saveNewColumnsWidth();
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [colGroupRef, columns, saveNewColumnsWidth]
  );

  const selectedAllIndeterminate = !!selectedLength && selectedLength > 0 && selectedLength < rowCount;
  const selectAllChecked = selectedLength === selectableRowCount || selectedLength === rowCount;

  return (
    <TableHeaderUI>
      <TableRowUI>
        {!!handleSelectAllClick && !!selectableRowCount && (
          <TableHeadUI className="p-1 text-center align-bottom">
            <Checkbox
              checked={selectedAllIndeterminate ? "indeterminate" : selectAllChecked}
              onCheckedChange={(checked) => {
                if (typeof handleSelectAllClick === "function") {
                  handleSelectAllClick({ target: { checked } } as React.ChangeEvent<HTMLInputElement>);
                }
              }}
            />
          </TableHeadUI>
        )}
        {columns.map((column, idx) => {
          const isLast = idx === columns.length - 1;
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

          return show ? (
            <TableHeadUI key={id} className="relative p-1 align-bottom" {...props}>
              <div className={`flex flex-row flex-nowrap items-center gap-0.5 ${alignJustifyClass}`}>
                {(!!data?.columnSortableValuePath || !!data?.customSortFn) && (
                  <button
                    type="button"
                    onClick={() => handleRequestSort(column)}
                    className="focus-visible:ring-ring cursor-pointer border-none bg-transparent p-0 outline-none hover:opacity-70 focus-visible:ring-2"
                  >
                    <svg viewBox={"0 0 18 18"} width={16} height={16} className="block h-4 w-4">
                      <path
                        d="M5.25 6L9 2.25L12.75 6H5.25Z"
                        className={isAscending ? "fill-foreground" : "fill-ring/50"}
                      />
                      <path
                        d="M5.25 12L9 15.75L12.75 12H5.25Z"
                        className={isDescending ? "fill-foreground" : "fill-ring/50"}
                      />
                    </svg>
                  </button>
                )}
                <span className="mt-1 text-sm font-semibold">{label}</span>
              </div>
              {!isLast && !column.cell.isFixed && !columns?.[idx + 1].cell.isFixed && (
                <div
                  className="absolute top-0 right-0 bottom-0 z-1 h-full w-px -translate-x-1/2 cursor-col-resize bg-transparent px-1 py-0 hover:bg-[hsl(var(--border)/0.05)]"
                  onMouseDown={(e) => handleMouseDown(e, column.id)}
                />
              )}
            </TableHeadUI>
          ) : null;
        })}
      </TableRowUI>
    </TableHeaderUI>
  );
};
