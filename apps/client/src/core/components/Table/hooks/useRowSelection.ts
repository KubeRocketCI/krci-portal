import React from "react";
import type { TableSelection } from "../types";

export interface RowSelection<DataType> {
  /** Spread into `DataTable`'s `selection`. */
  selection: Required<
    Pick<TableSelection<DataType>, "selected" | "isRowSelected" | "handleSelectRow" | "handleSelectAll">
  >;
  selectedRows: DataType[];
  clearSelection: () => void;
  deselectRows: (rows: readonly DataType[]) => void;
}

const NO_ROWS: never[] = [];

/**
 * Row selection for a client-mode `DataTable`, keyed by `getRowId`.
 *
 * - Selection persists across pages and data updates.
 * - Select-all adds or removes the current page.
 * - `selectedRows` holds the selected rows still present in `rows`.
 * - Mount dialogs that read `selectedRows` outside `DataTable`; `DataTable` unmounts the selection
 *   bar once no selected row remains in `rows`.
 */
export function useRowSelection<DataType>(
  rows: readonly DataType[],
  getRowId: (row: DataType) => string
): RowSelection<DataType> {
  const [selectedIds, setSelectedIds] = React.useState<ReadonlySet<string>>(() => new Set());
  const getRowIdRef = React.useRef(getRowId);
  getRowIdRef.current = getRowId;

  const isRowSelected = React.useCallback((row: DataType) => selectedIds.has(getRowIdRef.current(row)), [selectedIds]);

  const handleSelectRow = React.useCallback((_event: React.MouseEvent<HTMLButtonElement>, row: DataType) => {
    const id = getRowIdRef.current(row);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = React.useCallback((event: React.ChangeEvent<HTMLInputElement>, pageRows: DataType[]) => {
    const pageIds = pageRows.map(getRowIdRef.current);
    const select = event.target.checked;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => (select ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);

  const clearSelection = React.useCallback(() => setSelectedIds(new Set()), []);

  const deselectRows = React.useCallback((rowsToDeselect: readonly DataType[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      rowsToDeselect.forEach((row) => next.delete(getRowIdRef.current(row)));
      return next;
    });
  }, []);

  const selection = React.useMemo(
    () => ({ selected: Array.from(selectedIds), isRowSelected, handleSelectRow, handleSelectAll }),
    [selectedIds, isRowSelected, handleSelectRow, handleSelectAll]
  );

  const selectedRows = React.useMemo(
    () => (selectedIds.size ? rows.filter((row) => selectedIds.has(getRowIdRef.current(row))) : NO_ROWS),
    [rows, selectedIds]
  );

  return { selection, selectedRows, clearSelection, deselectRows };
}
