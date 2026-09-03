import { TABLE_WIDTH_DEFAULTS } from "./constants";
import { TableColumn } from "./types";

/** Structural subset of `SavedTableSettings`. This module does not import the storage schema. */
export type StoredColumnWidths = Record<string, { width?: number } | undefined>;

/**
 * Widths are pixels: `baseWidth` over the visible `baseWidth` sum, times the available
 * width. Sets need not total 100. `table-layout: fixed` normalises percent `<col>`
 * widths, not pixel ones, so the denominator is measured.
 */

/** `TABLE_MIN_WIDTH` until the container is measured. Non-finite input yields the floor. */
export const getSeedBasis = (containerWidth: number): number => {
  const width = Math.round(containerWidth);
  return Math.max(TABLE_WIDTH_DEFAULTS.TABLE_MIN_WIDTH, Number.isFinite(width) ? width : 0);
};

/** Basis minus the fixed leading columns. The space the data columns share. */
export const getAvailableWidth = (basis: number, leading: { expand?: boolean; selection?: boolean }): number =>
  basis -
  (leading.expand ? TABLE_WIDTH_DEFAULTS.EXPAND_COLUMN : 0) -
  (leading.selection ? TABLE_WIDTH_DEFAULTS.SELECTION_COLUMN : 0);

export const getColumnMinWidth = <DataType>(column: TableColumn<DataType>): number =>
  column.cell.minWidth ?? TABLE_WIDTH_DEFAULTS.MIN;

/** No last-column exception: every visible column is resizable. */
export const isColumnResizable = <DataType>(column: TableColumn<DataType>): boolean => {
  if (column.cell.show === false || column.cell.resizable === false) {
    return false;
  }

  // One `<col>` cannot drive a spanned header.
  return (column.cell.props?.colSpan ?? 1) <= 1;
};

/**
 * Widths reaching this may come from localStorage. Anything that is not a finite
 * positive number is discarded rather than clamped, so a corrupt entry seeds a
 * normal-looking column instead of a floor-width sliver.
 */
const isUsableWidth = (width: unknown): width is number =>
  typeof width === "number" && Number.isFinite(width) && width > 0;

/** The one width contract: every rendered, dragged and persisted width goes through this. */
export const clampColumnWidth = (width: number | undefined, minWidth: number): number => {
  if (!isUsableWidth(width)) {
    return minWidth;
  }

  return Math.min(Math.max(Math.round(width), minWidth), TABLE_WIDTH_DEFAULTS.MAX);
};

/** Ids whose persisted width should be honoured. Keeps the "what counts as pinned" rule in one module. */
export const getPinnedColumnIds = (saved: StoredColumnWidths | undefined): Set<string> =>
  new Set(Object.keys(saved ?? {}).filter((id) => isUsableWidth(saved?.[id]?.width)));

const getVisibleColumns = <DataType>(columns: TableColumn<DataType>[]): TableColumn<DataType>[] =>
  columns.filter((column) => column.cell.show !== false);

const sumBaseWidth = <DataType>(columns: TableColumn<DataType>[]): number =>
  columns.reduce((total, column) => total + column.cell.baseWidth, 0);

export const getSeedColumnWidth = <DataType>(
  column: TableColumn<DataType>,
  totalBaseWidth: number,
  available: number
): number => {
  const minWidth = getColumnMinWidth(column);

  if (totalBaseWidth <= 0) {
    return minWidth;
  }

  return clampColumnWidth((column.cell.baseWidth / totalBaseWidth) * available, minWidth);
};

/** Seed for one column of the current set, pins ignored. The width a reset restores. */
export const getSeedWidthFor = <DataType>(
  columns: TableColumn<DataType>[],
  columnId: string,
  available: number
): number => {
  const visible = getVisibleColumns(columns);
  const column = visible.find((candidate) => candidate.id === columnId);

  return column ? getSeedColumnWidth(column, sumBaseWidth(visible), available) : TABLE_WIDTH_DEFAULTS.MIN;
};

/**
 * Pinned columns hold their exact pixel width; unpinned columns split what is left,
 * so the visible widths sum to `available` whenever anything remains to distribute.
 * Iterates `columns`, never `saved`, so persisted entries for removed ids are ignored.
 */
export const resolveColumnWidths = <DataType>(
  columns: TableColumn<DataType>[],
  saved: StoredColumnWidths | undefined,
  available: number,
  pinned: ReadonlySet<string>,
  previous?: Record<string, number>
): Record<string, number> => {
  const visible = getVisibleColumns(columns);
  const widths: Record<string, number> = {};

  const pinnedWidths = new Map<string, number>();
  const unpinned: TableColumn<DataType>[] = [];

  for (const column of visible) {
    const savedWidth = isUsableWidth(saved?.[column.id]?.width) ? saved?.[column.id]?.width : undefined;
    const isPinned = pinned.has(column.id) || savedWidth !== undefined;

    if (isPinned) {
      pinnedWidths.set(column.id, clampColumnWidth(previous?.[column.id] ?? savedWidth, getColumnMinWidth(column)));
    } else {
      unpinned.push(column);
    }
  }

  let pinnedTotal = 0;
  for (const [id, width] of pinnedWidths) {
    widths[id] = width;
    pinnedTotal += width;
  }

  const remaining = available - pinnedTotal;
  const unpinnedBase = sumBaseWidth(unpinned);

  for (const column of unpinned) {
    widths[column.id] = remaining > 0 ? getSeedColumnWidth(column, unpinnedBase, remaining) : getColumnMinWidth(column);
  }

  // Hidden columns keep a width so re-showing one does not flash. They are excluded
  // from every sum above; the next re-derive gives them a real share.
  const totalBaseWidth = sumBaseWidth(columns);
  for (const column of columns) {
    if (widths[column.id] !== undefined) {
      continue;
    }

    const stored = previous?.[column.id] ?? saved?.[column.id]?.width;
    widths[column.id] = isUsableWidth(stored)
      ? clampColumnWidth(stored, getColumnMinWidth(column))
      : getSeedColumnWidth(column, totalBaseWidth, available);
  }

  return widths;
};
