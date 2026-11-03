import React from "react";
import { TableColumn } from "../../../../types";

export interface TableRowProps<DataType> {
  item: DataType;
  columns: TableColumn<DataType>[];
  isRowSelected?: boolean;
  isRowSelectable?: boolean;
  /** Tooltip text and accessible name of the disabled checkbox. */
  unselectableReason?: string;
  handleRowClick?: (event: React.MouseEvent<HTMLTableRowElement>, row: DataType) => void;
  handleSelectRowClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: DataType) => void;
  isExpandable?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  expandedContent?: React.ReactNode;
}
