import React from "react";
import { TableColumn } from "../types";
import { isColumnVisible } from "../utils";
import { SavedTableSettings } from "../components/TableSettings/types";
import { useTableSettings } from "../components/TableSettings/hooks/useTableSettings";

export interface ColumnSync<DataType> {
  /** Prop columns with saved visibility applied. Identity follows the prop array and changes on toggle. */
  columns: TableColumn<DataType>[];
  /** Persists `{ show }` for the column, then updates state. Width is never touched. */
  toggleColumnVisibility: (columnId: string, show: boolean) => void;
}

/** A saved boolean wins; anything else keeps the code value. Returns `columns` itself when nothing changes. */
const applySavedVisibility = <DataType>(
  columns: TableColumn<DataType>[],
  saved: SavedTableSettings
): TableColumn<DataType>[] => {
  let changed = false;
  const next = columns.map((column) => {
    const show = saved[column.id]?.show;
    if (typeof show !== "boolean" || show === isColumnVisible(column)) {
      return column;
    }
    changed = true;
    return { ...column, cell: { ...column.cell, show } };
  });
  return changed ? next : columns;
};

/**
 * Owns column visibility in the shell. State holds the saved-visibility snapshot, not the
 * columns: the columns are derived from the current prop on every render, so render
 * closures follow the parent's data. A toggle writes through to table settings and to the
 * snapshot. The snapshot is re-read when the table id changes.
 */
export function useColumnSync<DataType>(_columns: TableColumn<DataType>[], id: string): ColumnSync<DataType> {
  const { loadSettings, patchColumnSettings } = useTableSettings(id);

  const [saved, setSaved] = React.useState<SavedTableSettings>(loadSettings);
  const [syncedId, setSyncedId] = React.useState(id);

  // Re-sync during render, not in an effect: React restarts this component's render
  // before commit, so `useColumnResize` only commits its layout effect for the current
  // table's columns. Nothing stale is derived or painted.
  if (syncedId !== id) {
    setSyncedId(id);
    setSaved(loadSettings());
  }

  const columns = React.useMemo(() => applySavedVisibility(_columns, saved), [_columns, saved]);

  const toggleColumnVisibility = React.useCallback(
    (columnId: string, show: boolean) => {
      // Written outside the updater: StrictMode double-invokes state updaters.
      patchColumnSettings({ [columnId]: { show } });
      setSaved((prev) => ({ ...prev, [columnId]: { ...prev[columnId], id: columnId, show } }));
    },
    [patchColumnSettings]
  );

  return React.useMemo(() => ({ columns, toggleColumnVisibility }), [columns, toggleColumnVisibility]);
}
