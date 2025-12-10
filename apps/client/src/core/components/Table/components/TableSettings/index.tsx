import React from "react";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";
import { useTableSettings } from "./hooks/useTableSettings";
import { TableSettingsProps } from "./types";

export const TableSettings = <DataType,>({ id, columns, setColumns }: TableSettingsProps<DataType>) => {
  const { saveSettings } = useTableSettings(id);

  const visibleColumnCount = React.useMemo(() => columns.filter((col) => col.cell.show !== false).length, [columns]);

  const handleToggleColumn = React.useCallback(
    (columnId: string, checked: boolean) => {
      setColumns((prev) => {
        const updatedColumns = prev.map((column) =>
          column.id === columnId ? { ...column, cell: { ...column.cell, show: checked } } : column
        );

        const settings = updatedColumns.reduce<Record<string, { id: string; show: boolean }>>((acc, column) => {
          acc[column.id] = {
            id: column.id,
            show: column.cell.show !== false,
          };
          return acc;
        }, {});

        saveSettings(settings);

        return updatedColumns;
      });
    },
    [setColumns, saveSettings]
  );

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
              onCheckedChange={(checked) => handleToggleColumn(column.id, checked)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
