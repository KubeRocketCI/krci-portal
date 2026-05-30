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

  // The useState initializer already seeds the correct value on mount, so the
  // effect only needs to run when `sortSettings` actually changes afterwards.
  // Skipping the first run avoids a redundant extra render on every table mount
  // (createSortFunction returns a new closure, so re-setting would not bail out).
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSortState({
      order: sortSettings.order,
      sortFn: createSortFunction(sortSettings.order, sortSettings.sortBy),
      sortBy: sortSettings.sortBy,
    });
  }, [sortSettings.order, sortSettings.sortBy]);

  return [sortState, setSortState];
}
