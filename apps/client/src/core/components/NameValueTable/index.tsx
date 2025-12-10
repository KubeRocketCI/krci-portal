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
      <TableUI>
        <TableHeaderUI>
          <TableRowUI>
            <TableHeadUI className="w-[45%]">Name</TableHeadUI>
            <TableHeadUI className="w-[55%]">Value</TableHeadUI>
          </TableRowUI>
        </TableHeaderUI>
        <TableBodyUI>
          {rows.map((row, index) => (
            <TableRowUI key={index}>
              <TableCellUI className="h-8 text-sm">{row.name}</TableCellUI>
              <TableCellUI className="h-8 text-sm">{row.value}</TableCellUI>
            </TableRowUI>
          ))}
        </TableBodyUI>
      </TableUI>
    </div>
  );
};
