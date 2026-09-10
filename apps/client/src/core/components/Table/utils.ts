import { TABLE_CELL_DEFAULTS } from "./constants";
import type { TableColumn } from "./types";

/** Visibility after saved settings are applied. Hidden columns stay in `columns`; they render nothing. */
export const isColumnVisible = <DataType>({ cell }: TableColumn<DataType>) => cell?.show ?? TABLE_CELL_DEFAULTS.SHOW;

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
