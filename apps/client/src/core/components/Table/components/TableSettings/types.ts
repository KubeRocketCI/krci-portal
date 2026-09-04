import { ColumnResizeReset, TableColumn } from "../../types";

export interface TableSettingsProps<DataType> {
  columns: TableColumn<DataType>[];
  onToggleColumn: (columnId: string, show: boolean) => void;
  columnWidthReset: ColumnResizeReset;
}

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
