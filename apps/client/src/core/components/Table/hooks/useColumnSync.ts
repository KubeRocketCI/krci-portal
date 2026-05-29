import React from "react";

// Sync a local copy of `_columns` to internal state, refreshing only when the
// table identity (`id`) or the set of column ids changes. Depending on the
// `_columns` reference would wipe user-applied TableSettings visibility toggles
// on every parent re-render that produces a fresh array (e.g. data refetch).
// The ref holds the latest `_columns` so the effect can read it without
// listing it as a dep.
export function useColumnSync<C extends { id: string }>(
  _columns: C[],
  id: string
): [C[], React.Dispatch<React.SetStateAction<C[]>>] {
  const [columns, setColumns] = React.useState(_columns);
  const columnIdsKey = React.useMemo(() => _columns.map((c) => c.id).join("|"), [_columns]);
  const columnsRef = React.useRef(_columns);
  columnsRef.current = _columns;

  React.useEffect(() => {
    setColumns(columnsRef.current);
  }, [id, columnIdsKey]);

  return [columns, setColumns];
}
