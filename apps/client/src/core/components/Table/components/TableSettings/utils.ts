import { TABLE_CELL_DEFAULTS } from "../../constants";
import { SavedTableSettings } from "./types";

export const getSyncedColumnData = (
  settings: SavedTableSettings | undefined,
  columnId: string
): {
  show: boolean;
} => {
  const tableSettings = settings?.[columnId];

  return {
    show: tableSettings?.show ?? TABLE_CELL_DEFAULTS.SHOW,
  };
};
