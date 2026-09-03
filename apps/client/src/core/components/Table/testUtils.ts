import { TableColumn } from "./types";
import { SavedTableSettings } from "./components/TableSettings/types";

/** Literal on purpose: a persisted key. A rename needs a migration and must fail here. */
export const TABLE_SETTINGS_KEY = "tableSettings";

export type Row = { name: string };

/** A column whose label is its id and whose cell renders `name`. */
export const column = (
  id: string,
  baseWidth: number,
  cell: Partial<TableColumn<Row>["cell"]> = {}
): TableColumn<Row> => ({
  id,
  label: id,
  data: { render: ({ data }) => data.name },
  cell: { baseWidth, ...cell },
});

/** Writes the whole table-settings store, keyed by table id. */
export const seedTableSettings = (store: Record<string, SavedTableSettings>): void =>
  localStorage.setItem(TABLE_SETTINGS_KEY, JSON.stringify(store));

export const readTableSettings = (): Record<string, SavedTableSettings> =>
  JSON.parse(localStorage.getItem(TABLE_SETTINGS_KEY) ?? "{}");
