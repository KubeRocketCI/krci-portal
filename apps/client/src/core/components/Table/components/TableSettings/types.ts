import { ColumnResizeReset, TableColumn } from "../../types";

export interface TableSettingsProps<DataType> {
  id: string;
  columns: TableColumn<DataType>[];
  setColumns: React.Dispatch<React.SetStateAction<TableColumn<DataType>[]>>;
  columnWidthReset: ColumnResizeReset;
}

export interface TableSettingColumn<DataType> {
  id: TableColumn<DataType>["id"];
  label: TableColumn<DataType>["label"];
  show: boolean;
  disabled: boolean;
}

export type TableSettingsColumns<DataType> = Record<string, TableSettingColumn<DataType>>;

export interface SavedTableSettingsEntry {
  id: string;
  /** Absent means visible, so a width-only patch does not have to invent it. */
  show?: boolean;
  /** User-set column width in px. Absent means "use the seed width". */
  width?: number;
}

export type SavedTableSettings = Record<string, SavedTableSettingsEntry>;

/** Absent key leaves a value alone. `null` deletes it — `null` rather than `undefined` so a delete survives a spread. */
export type SavedTableSettingsPatch = Record<string, { show?: boolean; width?: number | null }>;
