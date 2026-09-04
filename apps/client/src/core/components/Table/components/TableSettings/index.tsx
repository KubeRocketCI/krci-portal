import React from "react";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { RotateCcw, Settings2 } from "lucide-react";
import { TableSettingsProps } from "./types";

export const TableSettings = <DataType,>({
  columns,
  onToggleColumn,
  columnWidthReset,
}: TableSettingsProps<DataType>) => {
  const visibleColumnCount = React.useMemo(() => columns.filter((col) => col.cell.show !== false).length, [columns]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="dark" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Columns
          <Badge variant="dark" className="bg-muted ml-1 px-1.5 py-0 text-xs">
            {visibleColumnCount}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => {
          const isFixed = column.cell?.isFixed === true;
          const isVisible = column.cell.show !== false;

          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={isVisible}
              disabled={isFixed}
              onCheckedChange={(checked) => onToggleColumn(column.id, checked)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={columnWidthReset.all} disabled={!columnWidthReset.isAvailable}>
          <RotateCcw className="h-4 w-4" />
          Reset column widths
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
