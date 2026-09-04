import { act } from "@testing-library/react";
import { TableColumn } from "./types";
import { SavedTableSettings } from "./components/TableSettings/types";
import { COLUMN_RESIZER_SLOT } from "./components/ColumnResizer";

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

/** Selector for a column's resize handle inside its header cell. */
export const HANDLE_SELECTOR = `th [data-slot="${COLUMN_RESIZER_SLOT}"]`;

/** The `<col>` at `index`, in colgroup order. */
export const colFor = (container: HTMLElement, index: number) =>
  container.querySelectorAll("col")[index] as HTMLTableColElement;

/** The resize handle at `index`, in header order. */
export const handleFor = (container: HTMLElement, index: number) =>
  container.querySelectorAll(HANDLE_SELECTOR)[index] as HTMLElement;

/** Drags a handle by `byPixels` through the document-level listeners the resize hook attaches. */
export const dragHandle = (handle: HTMLElement, byPixels: number) => {
  act(() => {
    handle.dispatchEvent(new MouseEvent("pointerdown", { clientX: 0, bubbles: true }));
  });
  act(() => {
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: byPixels, bubbles: true }));
    document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
  });
};
