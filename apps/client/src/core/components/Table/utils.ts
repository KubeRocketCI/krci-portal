import { TABLE_CELL_DEFAULTS } from "./constants";
import type { TableColumn } from "./types";

/** Visibility after saved settings are applied. Hidden columns stay in `columns`; they render nothing. */
export const isColumnVisible = <DataType>({ cell }: TableColumn<DataType>) => cell?.show ?? TABLE_CELL_DEFAULTS.SHOW;

/** Select-all checkbox state for one page: checked when every selectable row is selected. */
export const getSelectAllState = (selectableRowCount: number, selectedRowCount: number): boolean | "indeterminate" => {
  if (selectableRowCount > 0 && selectedRowCount === selectableRowCount) return true;
  return selectedRowCount > 0 ? "indeterminate" : false;
};

export const getFlexPropertyByTextAlign = (textAlign: string) => {
  switch (textAlign) {
    case "center":
      return "center";
    case "right":
      return "flex-end";
    default:
      return "flex-start";
  }
};
