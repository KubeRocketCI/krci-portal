import React from "react";
import { SORT_ORDERS } from "../constants";
import { createColumnComparator, getNextSortOrder, isColumnSortable } from "../sort";
import type { SortOrder, TableColumn, TableSort } from "../types";
import { isColumnVisible } from "../utils";

export interface TableSortController<DataType> {
  /** Column id of the active sort. Undefined while unsorted. */
  sortBy: string | undefined;
  order: SortOrder;
  comparator: (a: DataType, b: DataType) => number;
  /** Advances the sort direction for `columnId` and makes it the active column. */
  requestSort: (columnId: string) => void;
}

/**
 * Single owner of table sort: resolves `sortBy` against the column set, derives the
 * comparator from whichever sort key that column declares, and advances the order on
 * a header click.
 *
 * Only a visible column orders the data. Hiding the active column keeps `sortBy` and
 * sorts nothing until the column is shown again, so no header-less sort is ever applied.
 * `isRowPinned` ranks matching rows first under every column and both directions.
 */
export function useTableSort<DataType>(
  columns: TableColumn<DataType>[],
  defaultSort?: TableSort,
  isRowPinned?: (row: DataType) => boolean
): TableSortController<DataType> {
  const [sort, setSort] = React.useState<TableSort | undefined>(defaultSort);

  // Tracked as primitives so a caller passing `sort` inline does not reset on every render.
  const defaultSortBy = defaultSort?.sortBy;
  const defaultOrder = defaultSort?.order;

  // Ids only: a visibility toggle rewrites `columns` without changing the set, and must not
  // discard the user's sort. Swapping resource kinds does change it.
  const columnIdsKey = React.useMemo(() => columns.map((column) => column.id).join("|"), [columns]);
  const resetKey = `${columnIdsKey}\n${defaultSortBy}\n${defaultOrder}`;
  const [syncedKey, setSyncedKey] = React.useState(resetKey);

  // Reset during render: React restarts the render before commit, so no stale sort is
  // painted or warned about. Seeded from the initial key, so mount never resets.
  if (syncedKey !== resetKey) {
    setSyncedKey(resetKey);
    setSort(
      defaultSortBy === undefined ? undefined : { sortBy: defaultSortBy, order: defaultOrder ?? SORT_ORDERS.UNSET }
    );
  }

  // `useColumnSync` rewrites only the toggled column's object, so this identity survives
  // other columns' visibility toggles and the comparator below is not rebuilt for them.
  const sortColumn = React.useMemo(() => columns.find((column) => column.id === sort?.sortBy), [columns, sort?.sortBy]);
  const activeColumn = sortColumn && isColumnVisible(sortColumn) ? sortColumn : undefined;
  const order = sort?.order ?? SORT_ORDERS.UNSET;

  const comparator = React.useMemo(
    () => createColumnComparator(activeColumn, order, isRowPinned),
    [activeColumn, order, isRowPinned]
  );

  // `sortBy` is a column id, not a data path, and the column it names must declare a sort key.
  // Either mistake silently renders the table unsorted.
  React.useEffect(() => {
    if (!import.meta.env.DEV || !sort?.sortBy) {
      return;
    }
    if (!sortColumn) {
      console.warn(`[DataTable] sort.sortBy "${sort.sortBy}" matches no column id; rendering unsorted.`);
    } else if (!isColumnSortable(sortColumn)) {
      console.warn(`[DataTable] sort.sortBy "${sort.sortBy}" names a column with no sort key; rendering unsorted.`);
    }
  }, [sortColumn, sort?.sortBy]);

  const requestSort = React.useCallback((columnId: string) => {
    setSort((prev) => ({
      sortBy: columnId,
      order: getNextSortOrder(prev?.order ?? SORT_ORDERS.UNSET, prev?.sortBy === columnId),
    }));
  }, []);

  return { sortBy: sort?.sortBy, order, comparator, requestSort };
}
