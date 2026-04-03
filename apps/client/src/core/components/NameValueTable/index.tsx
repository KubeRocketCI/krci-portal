import React from "react";
import { TableUI, TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI } from "@/core/components/ui/table";

export type NameValueRow = {
  name: React.ReactNode;
  value: React.ReactNode;
};

export const NameValueTable = ({ rows }: { rows: NameValueRow[] }) => {
  if (!rows?.length) {
    return null;
  }

  return (
    <div className="bg-card rounded-md border">
      <TableUI className="table-fixed">
        <TableHeaderUI>
          <TableRowUI>
            <TableHeadUI className="bg-muted text-muted-foreground w-[45%] px-4 py-2 text-left text-xs font-medium">
              Name
            </TableHeadUI>
            <TableHeadUI className="bg-muted text-muted-foreground w-[55%] px-4 py-2 text-left text-xs font-medium">
              Value
            </TableHeadUI>
          </TableRowUI>
        </TableHeaderUI>
        <TableBodyUI>
          {rows.map((row, index) => (
            <TableRowUI key={index}>
              <TableCellUI
                className="h-10 min-w-0 truncate px-4 py-2 align-top text-sm"
                title={typeof row.name === "string" ? row.name : undefined}
              >
                {row.name}
              </TableCellUI>
              <TableCellUI
                className="h-10 min-w-0 truncate px-4 py-2 align-top text-sm"
                title={typeof row.value === "string" ? row.value : undefined}
              >
                {row.value}
              </TableCellUI>
            </TableRowUI>
          ))}
        </TableBodyUI>
      </TableUI>
    </div>
  );
};
