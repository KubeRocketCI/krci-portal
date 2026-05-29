import React from "react";
import type { SortState, TableSort } from "../types";
import { createSortFunction } from "../utils";

// Holds local sort state seeded from `sortSettings`, and resets it whenever the
// parent passes a new default sort (e.g. switching resource kinds in
// K8sListPage). Without the reset, the table holds onto the previous
// resource's `sortBy` id and renders incorrectly against the new columns.
export function useSyncedSortState<DataType>(
  sortSettings: TableSort
): [SortState<DataType>, React.Dispatch<React.SetStateAction<SortState<DataType>>>] {
  const [sortState, setSortState] = React.useState<SortState<DataType>>(() => ({
    order: sortSettings.order,
    sortFn: createSortFunction(sortSettings.order, sortSettings.sortBy),
    sortBy: sortSettings.sortBy,
  }));

  React.useEffect(() => {
    setSortState({
      order: sortSettings.order,
      sortFn: createSortFunction(sortSettings.order, sortSettings.sortBy),
      sortBy: sortSettings.sortBy,
    });
  }, [sortSettings.order, sortSettings.sortBy]);

  return [sortState, setSortState];
}
