import React from "react";
import { RESIZING_BODY_CLASS, TABLE_WIDTH_DEFAULTS } from "../constants";
import { ColumnResizeReset, TableColumn } from "../types";
import type { ColumnResizerProps } from "../components/ColumnResizer/types";
import type { ColumnColProps } from "../components/TableColgroup/types";
import {
  clampColumnWidth,
  getAvailableWidth,
  getColumnMinWidth,
  getPinnedColumnIds,
  getSeedBasis,
  getSeedWidthFor,
  isColumnResizable,
  resolveColumnWidths,
} from "../columnWidths";
import { useTableSettings } from "../components/TableSettings/hooks/useTableSettings";
import { useIsNarrow } from "@/core/hooks/use-narrow";
import { TABLE_CONTAINER_SLOT } from "@/core/components/ui/table/constants";

const TABLE_CONTAINER_SELECTOR = `[data-slot="${TABLE_CONTAINER_SLOT}"]`;

export interface UseColumnResizeParams<DataType> {
  tableId: string;
  /** The synced columns array, not the raw prop. */
  columns: TableColumn<DataType>[];
  /** Both shrink the space the data columns share, and both change with data state. */
  showExpandColumn?: boolean;
  showSelectionColumn?: boolean;
}

export interface ColumnResizeApi {
  getColProps: (columnId: string) => ColumnColProps;
  /** `null` when the column is not resizable, or when the viewport is narrow. */
  getResizerProps: (columnId: string) => ColumnResizerProps | null;
  reset: ColumnResizeReset;
}

export const useColumnResize = <DataType>({
  tableId,
  columns,
  showExpandColumn,
  showSelectionColumn,
}: UseColumnResizeParams<DataType>): ColumnResizeApi => {
  const { loadSettings, patchColumnSettings } = useTableSettings(tableId);
  const isNarrow = useIsNarrow();

  // Explicit `number`: the constant is `as const`, so inference would pin this to the literal 1360.
  const [basis, setBasis] = React.useState<number>(TABLE_WIDTH_DEFAULTS.TABLE_MIN_WIDTH);
  const [pinned, setPinned] = React.useState<Set<string>>(() => getPinnedColumnIds(loadSettings()));
  const [widths, setWidths] = React.useState<Record<string, number>>(() => {
    const saved = loadSettings();
    return resolveColumnWidths(
      columns,
      saved,
      getAvailableWidth(TABLE_WIDTH_DEFAULTS.TABLE_MIN_WIDTH, {
        expand: showExpandColumn,
        selection: showSelectionColumn,
      }),
      getPinnedColumnIds(saved)
    );
  });

  const available = getAvailableWidth(basis, { expand: showExpandColumn, selection: showSelectionColumn });

  // Mirrors read by the drag handlers and by `recompute`, which must not re-create per render.
  const columnsRef = React.useRef(columns);
  columnsRef.current = columns;
  const widthsRef = React.useRef(widths);
  widthsRef.current = widths;
  const pinnedRef = React.useRef(pinned);
  pinnedRef.current = pinned;
  const availableRef = React.useRef(available);
  availableRef.current = available;

  const colRefs = React.useRef<Record<string, HTMLTableColElement | null>>({});
  const colRefCallbacks = React.useRef<Record<string, React.RefCallback<HTMLTableColElement>>>({});
  const containerRef = React.useRef<HTMLElement | null>(null);
  const observerRef = React.useRef<ResizeObserver | null>(null);
  const lastMeasuredRef = React.useRef<number | null>(null);
  const endDragRef = React.useRef<(() => void) | null>(null);
  const tableIdRef = React.useRef(tableId);
  /**
   * The in-flight drag width. Held apart from `widthsRef`, which aliases the `widths`
   * state object and must never be written to. Merged over `prev` by `recompute` so a
   * mid-drag re-derive cannot resolve the active column from its stale committed width.
   */
  const dragWidthRef = React.useRef<{ columnId: string; width: number } | null>(null);

  // Visibility is part of the key: hiding a column changes the baseWidth denominator,
  // so the remaining columns must take up its share.
  const visibleKey = React.useMemo(
    () => columns.map((column) => `${column.id}:${column.cell.show !== false}`).join("|"),
    [columns]
  );

  /**
   * `discardPrevious`: resolve pinned columns from saved settings only. Session widths
   * are a different table's widths after a `tableId` change; a shared column id would
   * otherwise keep the outgoing table's width.
   */
  const recompute = React.useCallback(
    (nextPinned: Set<string>, options?: { discardPrevious?: boolean }) => {
      setWidths((prev) => {
        const drag = dragWidthRef.current;
        const carried = options?.discardPrevious ? undefined : prev;
        const base = drag ? { ...carried, [drag.columnId]: drag.width } : carried;
        return resolveColumnWidths(columnsRef.current, loadSettings(), availableRef.current, nextPinned, base);
      });
    },
    [loadSettings]
  );

  /**
   * Pins follow table id and column set. Table change: session pins and session widths
   * are dropped, both re-read from saved settings. Column-set change: pins for surviving
   * ids are kept.
   */
  React.useLayoutEffect(() => {
    const tableChanged = tableIdRef.current !== tableId;
    tableIdRef.current = tableId;

    const savedPins = getPinnedColumnIds(loadSettings());
    const carried = tableChanged ? new Set<string>() : pinnedRef.current;

    const nextPinned = new Set<string>();
    for (const { id } of columnsRef.current) {
      if (carried.has(id) || savedPins.has(id)) {
        nextPinned.add(id);
      }
    }

    if (nextPinned.size !== pinnedRef.current.size || [...nextPinned].some((id) => !pinnedRef.current.has(id))) {
      pinnedRef.current = nextPinned;
      setPinned(nextPinned);
    }

    recompute(nextPinned, { discardPrevious: tableChanged });
  }, [tableId, visibleKey, available, recompute, loadSettings]);

  /**
   * The basis is the scroll container's width. Reached from a `<col>` the hook already
   * owns, so no ref has to be placed by the shells. `clientWidth` there comes from the
   * container's ancestors, never from the table's content width, so there is no feedback.
   */
  const observeContainer = React.useCallback((node: HTMLTableColElement) => {
    const container = node.closest<HTMLElement>(TABLE_CONTAINER_SELECTOR);
    if (!container || container === containerRef.current) {
      return;
    }

    containerRef.current = container;
    observerRef.current?.disconnect();

    const measure = () => {
      const next = Math.round(container.clientWidth);
      // Guarded: the observer also fires on height-only changes every time rows arrive.
      if (next !== lastMeasuredRef.current) {
        lastMeasuredRef.current = next;
        setBasis(getSeedBasis(next));
      }
    };

    measure();
    observerRef.current = new ResizeObserver(measure);
    observerRef.current.observe(container);
  }, []);

  const getColRef = React.useCallback(
    (columnId: string): React.RefCallback<HTMLTableColElement> => {
      if (!colRefCallbacks.current[columnId]) {
        colRefCallbacks.current[columnId] = (node) => {
          colRefs.current[columnId] = node;
          if (node) {
            observeContainer(node);
          }
        };
      }
      return colRefCallbacks.current[columnId];
    },
    [observeContainer]
  );

  /**
   * `widths` dep: `getColProps` identity is `TableColgroup`'s memo key. It changes on
   * commit, reset and re-seed, never mid-drag.
   */
  const getColProps = React.useCallback(
    (columnId: string) => ({
      ref: getColRef(columnId),
      style: { width: widths[columnId] ?? getSeedWidthFor(columns, columnId, available) },
    }),
    [widths, getColRef, columns, available]
  );

  const startResize = React.useCallback(
    (columnId: string) => (event: React.PointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();

      event.currentTarget.setPointerCapture?.(event.pointerId);
      document.body.classList.add(RESIZING_BODY_CLASS);

      const column = columnsRef.current.find((candidate) => candidate.id === columnId);
      const minWidth = column ? getColumnMinWidth(column) : TABLE_WIDTH_DEFAULTS.MIN;
      const startX = event.clientX;
      const startWidth = widthsRef.current[columnId] ?? minWidth;
      const wasPinned = pinnedRef.current.has(columnId);
      let latest = startWidth;

      // Pinned up front: a container change mid-drag must not re-seed this column.
      if (!wasPinned) {
        setPinned((prev) => new Set(prev).add(columnId));
      }

      const onMove = (moveEvent: PointerEvent) => {
        // Same clamp as every other path, so the rendered width always equals the stored one.
        latest = clampColumnWidth(startWidth + (moveEvent.clientX - startX), minWidth);
        dragWidthRef.current = { columnId, width: latest };
        const col = colRefs.current[columnId];
        if (col) {
          col.style.width = `${latest}px`;
        }
      };

      const onEnd = () => {
        endDragRef.current = null;
        dragWidthRef.current = null;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onEnd);
        document.removeEventListener("pointercancel", onEnd);
        document.removeEventListener("lostpointercapture", onEnd);
        document.body.classList.remove(RESIZING_BODY_CLASS);

        // A double-click fires two zero-delta drags before `onDoubleClick`.
        if (latest === startWidth) {
          if (!wasPinned) {
            setPinned((prev) => {
              const next = new Set(prev);
              next.delete(columnId);
              return next;
            });
          }
          return;
        }

        setWidths((prev) => ({ ...prev, [columnId]: latest }));
        patchColumnSettings({ [columnId]: { width: latest } });
      };

      // Listeners on `document`: the handle unmounts when the column is hidden or the
      // viewport goes narrow, which would otherwise strand the body class.
      endDragRef.current = onEnd;
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onEnd);
      document.addEventListener("pointercancel", onEnd);
      document.addEventListener("lostpointercapture", onEnd);
    },
    [patchColumnSettings]
  );

  const resetColumnWidth = React.useCallback(
    (columnId: string) => {
      const nextPinned = new Set(pinnedRef.current);
      nextPinned.delete(columnId);

      setPinned(nextPinned);
      patchColumnSettings({ [columnId]: { width: null } });
      recompute(nextPinned);
    },
    [patchColumnSettings, recompute]
  );

  const resetAllColumnWidths = React.useCallback(() => {
    const ids = new Set([...Object.keys(loadSettings()), ...columnsRef.current.map((column) => column.id)]);
    const patch = Object.fromEntries([...ids].map((id) => [id, { width: null }]));

    patchColumnSettings(patch);
    setPinned(new Set());
    recompute(new Set());
  }, [loadSettings, patchColumnSettings, recompute]);

  const getResizerProps = React.useCallback(
    (columnId: string): ColumnResizerProps | null => {
      // Narrow viewport: no handles. The `touch-none` hit strip would block horizontal
      // swipe scrolling. Widths still apply; the table scrolls sideways.
      if (isNarrow) {
        return null;
      }

      const column = columns.find((candidate) => candidate.id === columnId);
      if (!column || !isColumnResizable(column)) {
        return null;
      }

      return {
        onPointerDown: startResize(columnId),
        onDoubleClick: () => resetColumnWidth(columnId),
      };
    },
    [isNarrow, columns, startResize, resetColumnWidth]
  );

  const reset = React.useMemo<ColumnResizeReset>(
    () => ({ all: resetAllColumnWidths, isAvailable: pinned.size > 0 }),
    [resetAllColumnWidths, pinned]
  );

  React.useEffect(
    () => () => {
      observerRef.current?.disconnect();
      endDragRef.current?.();
    },
    []
  );

  return React.useMemo(() => ({ getColProps, getResizerProps, reset }), [getColProps, getResizerProps, reset]);
};
