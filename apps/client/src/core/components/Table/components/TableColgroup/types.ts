import React from "react";
import { TableColumn } from "../../types";

/** Ref and width for one `<col>`, produced by `useColumnResize`. */
export interface ColumnColProps {
  ref: React.RefCallback<HTMLTableColElement>;
  style: React.CSSProperties;
}

export interface TableColgroupProps<DataType> {
  columns: TableColumn<DataType>[];
  getColProps: (columnId: string) => ColumnColProps;
  showExpandColumn?: boolean;
  showSelectionColumn?: boolean;
}
