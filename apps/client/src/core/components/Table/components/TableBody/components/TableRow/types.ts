import React from "react";
import { TableColumn } from "../../../../types";

export interface TableRowProps<DataType> {
  item: DataType;
  columns: TableColumn<DataType>[];
  isRowSelected?: boolean;
  isRowSelectable?: boolean;
  handleRowClick?: (event: React.MouseEvent<HTMLTableRowElement>, row: DataType) => void;
  handleSelectRowClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: DataType) => void;
}
