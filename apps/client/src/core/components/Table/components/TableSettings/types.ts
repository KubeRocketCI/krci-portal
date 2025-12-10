import { TableColumn } from "../../types";

export interface TableSettingsProps<DataType> {
  id: string;
  columns: TableColumn<DataType>[];
  setColumns: React.Dispatch<React.SetStateAction<TableColumn<DataType>[]>>;
}

export interface TableSettingColumn<DataType> {
  id: TableColumn<DataType>["id"];
  label: TableColumn<DataType>["label"];
  show: boolean;
  disabled: boolean;
}

export type TableSettingsColumns<DataType> = Record<string, TableSettingColumn<DataType>>;

export type SavedTableSettings = Record<
  string,
  {
    id: string;
    show: boolean;
  }
>;
