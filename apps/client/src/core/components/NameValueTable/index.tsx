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
    <div className="rounded-md border p-4">
      <TableUI className="table-fixed">
        <TableHeaderUI>
          <TableRowUI>
            <TableHeadUI className="w-[45%]">Name</TableHeadUI>
            <TableHeadUI className="w-[55%]">Value</TableHeadUI>
          </TableRowUI>
        </TableHeaderUI>
        <TableBodyUI>
          {rows.map((row, index) => (
            <TableRowUI key={index}>
              <TableCellUI
                className="h-8 min-w-0 truncate text-sm"
                title={typeof row.name === "string" ? row.name : undefined}
              >
                {row.name}
              </TableCellUI>
              <TableCellUI
                className="h-8 min-w-0 truncate text-sm"
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
