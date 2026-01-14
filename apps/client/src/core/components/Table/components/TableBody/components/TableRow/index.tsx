import { Checkbox } from "@/core/components/ui/checkbox";
import React from "react";
import { TableCellUI, TableRowUI } from "@/core/components/ui/table";
import { TableRowProps } from "./types";
import { TABLE_CELL_DEFAULTS } from "@/core/components/Table/constants";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/utils/classname";

export const TableRow = <DataType,>({
  item,
  columns,
  handleRowClick,
  handleSelectRowClick,
  isRowSelected,
  isRowSelectable,
  isExpandable,
  isExpanded,
  onToggleExpand,
  expandedContent,
}: TableRowProps<DataType>) => {
  const selectableRowProps = (row: DataType, isSelected: boolean) => {
    // If row is expandable, don't make the whole row clickable (only chevron should expand)
    if (isExpandable) {
      return {
        className: cn(isSelected && "bg-accent"),
      };
    }

    return handleRowClick
      ? {
          role: "radio",
          "aria-checked": isSelected,
          tabIndex: -1,
          onClick: (event: React.MouseEvent<HTMLTableRowElement>) => {
            handleRowClick(event, row);
          },
          className: cn("cursor-pointer", isSelected && "bg-accent"),
        }
      : {};
  };

  const getColumnPadding = React.useCallback((hasSortableValue: boolean, textAlign: string) => {
    // 18px is the width of the arrow icon + 1.6px is the padding between the icon and the text
    // 18 + 1.6 = 19.6px ≈ 20px = pl-5
    if (hasSortableValue && textAlign !== "center") {
      return "pl-5";
    }
    return "";
  }, []);

  const getJustifyClass = (align?: string) => {
    switch (align) {
      case "center":
        return "justify-center";
      case "right":
        return "justify-end";
      default:
        return "justify-start";
    }
  };

  const visibleColumnsCount = columns.filter((col) => col.cell?.show !== false).length;
  const totalColumnsCount = visibleColumnsCount + (handleSelectRowClick ? 1 : 0) + (isExpandable ? 1 : 0);

  return (
    <>
      <TableRowUI {...selectableRowProps(item, !!isRowSelected)}>
        {isExpandable && (
          <TableCellUI className="w-10 px-1 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.();
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </TableCellUI>
        )}
        {!!handleSelectRowClick && (
          <TableCellUI className="px-1 py-2 text-center">
            <Checkbox
              checked={isRowSelected}
              onCheckedChange={(checked) => {
                const syntheticEvent = {
                  currentTarget: { checked },
                  stopPropagation: () => {},
                  preventDefault: () => {},
                } as unknown as React.MouseEvent<HTMLButtonElement>;
                handleSelectRowClick(syntheticEvent, item);
              }}
              disabled={!isRowSelectable}
            />
          </TableCellUI>
        )}
        {columns.map(({ id, data, cell }) => {
          const show = cell?.show ?? TABLE_CELL_DEFAULTS.SHOW;
          const props = {
            ...TABLE_CELL_DEFAULTS.PROPS,
            ...cell?.props,
          };

          const alignClass = props?.align === "center" ? "text-center" : props?.align === "right" ? "text-right" : "";
          const paddingClass = "py-2 px-3";
          const sortablePaddingClass = getColumnPadding(!!data?.columnSortableValuePath, props?.align || "");

          return show ? (
            <TableCellUI
              key={id}
              className={`${paddingClass} ${alignClass} ${sortablePaddingClass} ${id === "description" ? "min-w-0" : ""}`}
            >
              <div
                className={`flex items-center text-sm ${getJustifyClass(props?.align)} ${id === "description" ? "w-full min-w-0" : ""}`}
              >
                {data.render({ data: item })}
              </div>
            </TableCellUI>
          ) : null;
        })}
      </TableRowUI>
      {isExpandable && isExpanded && expandedContent && (
        <TableRowUI>
          <TableCellUI colSpan={totalColumnsCount} className="border-t-0 p-0">
            <div className="bg-muted/30 border-border border-t p-6">{expandedContent}</div>
          </TableCellUI>
        </TableRowUI>
      )}
    </>
  );
};
