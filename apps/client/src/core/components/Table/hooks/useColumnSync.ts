import React from "react";
import { TableColumn } from "../types";
import { SavedTableSettings } from "../components/TableSettings/types";
import { useTableSettings } from "../components/TableSettings/hooks/useTableSettings";

export interface ColumnSync<DataType> {
  /** Prop columns with saved visibility applied. Identity changes on table id change, column-set change, or toggle. */
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
    if (typeof show !== "boolean" || show === (column.cell.show ?? true)) {
      return column;
    }
    changed = true;
    return { ...column, cell: { ...column.cell, show } };
  });
  return changed ? next : columns;
};

/**
 * Owns column visibility in the shell. Saved visibility is applied on sync; a toggle
 * writes through to table settings. Re-syncs only when the table id or the set of
 * column ids changes. A fresh `_columns` reference with the same ids (a data refetch)
 * is ignored, so user toggles survive.
 */
export function useColumnSync<DataType>(_columns: TableColumn<DataType>[], id: string): ColumnSync<DataType> {
  const { loadSettings, patchColumnSettings } = useTableSettings(id);

  const columnIdsKey = React.useMemo(() => _columns.map((c) => c.id).join("|"), [_columns]);
  const syncKey = `${id}\n${columnIdsKey}`;

  const [columns, setColumns] = React.useState(() => applySavedVisibility(_columns, loadSettings()));
  const [syncedKey, setSyncedKey] = React.useState(syncKey);

  // Re-sync during render, not in an effect: React restarts this component's render
  // before commit, so `useColumnResize` only commits its layout effect for the current
  // table's columns. Nothing stale is derived or painted.
  if (syncedKey !== syncKey) {
    setSyncedKey(syncKey);
    setColumns(applySavedVisibility(_columns, loadSettings()));
  }

  const toggleColumnVisibility = React.useCallback(
    (columnId: string, show: boolean) => {
      // Written outside the updater: StrictMode double-invokes state updaters.
      patchColumnSettings({ [columnId]: { show } });
      setColumns((prev) =>
        prev.map((column) => (column.id === columnId ? { ...column, cell: { ...column.cell, show } } : column))
      );
    },
    [patchColumnSettings]
  );

  return React.useMemo(() => ({ columns, toggleColumnVisibility }), [columns, toggleColumnVisibility]);
}
