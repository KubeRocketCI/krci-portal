import get from "lodash/get";
import { SORT_ORDERS } from "./constants";
import type { SortOrder, TableColumn } from "./types";

/** Leaves source order untouched. `Array.prototype.sort` is stable. */
const KEEP_SOURCE_ORDER = () => 0;

/** RFC3339 / ISO-8601 date-time. Kubernetes emits `2026-09-10T10:00:00Z`. */
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/;

/** `NaN` counts as absent; it has no order against a real value. */
const isMissing = (value: unknown) =>
  value === null || value === undefined || value === "" || (typeof value === "number" && Number.isNaN(value));

/**
 * A finite number, or a string that is entirely one. Null otherwise.
 * Numeric strings must not reach locale collation: it ranks `85.3` before `85.25`.
 * SonarQube measures arrive as strings.
 */
const asNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/** A row's sort key, parsed into every form a comparison needs. Built once per row. */
interface SortKey {
  missing: boolean;
  number: number | null;
  time: number | null;
  text: string;
}

const MISSING_KEY: SortKey = { missing: true, number: null, time: null, text: "" };

const toSortKey = (value: unknown): SortKey => {
  if (isMissing(value)) {
    return MISSING_KEY;
  }
  const number = asNumber(value);
  const text = String(value);
  const time = number === null && TIMESTAMP_PATTERN.test(text) ? Date.parse(text) : NaN;
  return { missing: false, number, time: Number.isNaN(time) ? null : time, text };
};

/** Null when both are present. Missing ranks last in both directions — never scale this by direction. */
const compareMissing = (a: SortKey, b: SortKey): number | null => {
  if (!a.missing && !b.missing) {
    return null;
  }
  if (a.missing && b.missing) {
    return 0;
  }
  return a.missing ? 1 : -1;
};

/** Ascending. Numbers compare numerically, timestamps chronologically, everything else by locale. */
const compareDefined = (a: SortKey, b: SortKey): number => {
  if (a.number !== null && b.number !== null) {
    return a.number - b.number;
  }
  if (a.time !== null && b.time !== null) {
    return a.time - b.time;
  }
  // `numeric` keeps `item-2` ahead of `item-10`; `base` sensitivity is case-insensitive.
  return a.text.localeCompare(b.text, undefined, { numeric: true, sensitivity: "base" });
};

export const isColumnSortable = <DataType>({ data }: TableColumn<DataType>) =>
  !!data.columnSortableValue || !!data.columnSortableValuePath || !!data.customSortFn;

/** Reads whichever key-shaped sort the column declares. The type keeps the two mutually exclusive. */
const sortKeyAccessor = <DataType>({ data }: TableColumn<DataType>): ((row: DataType) => unknown) | undefined => {
  if (data.columnSortableValue) {
    return data.columnSortableValue;
  }
  const path = data.columnSortableValuePath;
  return path ? (row) => get(row, path) : undefined;
};

/**
 * `customSortFn` is written ascending; descending negates its whole result, so it must not
 * carry direction-invariant rules. An unresolved, unsortable or unset column keeps source order.
 */
const createValueComparator = <DataType>(
  column: TableColumn<DataType> | undefined,
  order: SortOrder
): ((a: DataType, b: DataType) => number) => {
  if (!column || order === SORT_ORDERS.UNSET) {
    return KEEP_SOURCE_ORDER;
  }

  const direction = order === SORT_ORDERS.DESC ? -1 : 1;
  const getSortKey = sortKeyAccessor(column);

  if (getSortKey) {
    // One key per row, not one per comparison. The cache dies with this comparator.
    const cache = new WeakMap<object, SortKey>();
    const keyOf = (row: DataType): SortKey => {
      if (row === null || typeof row !== "object") {
        return toSortKey(getSortKey(row));
      }
      const cached = cache.get(row);
      if (cached) {
        return cached;
      }
      const key = toSortKey(getSortKey(row));
      cache.set(row, key);
      return key;
    };

    return (a, b) => {
      const aKey = keyOf(a);
      const bKey = keyOf(b);
      return compareMissing(aKey, bKey) ?? direction * compareDefined(aKey, bKey);
    };
  }

  const { customSortFn } = column.data;
  if (customSortFn) {
    return (a, b) => direction * customSortFn(a, b);
  }

  return KEEP_SOURCE_ORDER;
};

/**
 * Pinned rows rank first in both directions and under an unset sort — never scale this by
 * direction. The column then orders each partition. Missing values rank last within a partition.
 */
export const createColumnComparator = <DataType>(
  column: TableColumn<DataType> | undefined,
  order: SortOrder,
  isPinned?: (row: DataType) => boolean
): ((a: DataType, b: DataType) => number) => {
  const compareByColumn = createValueComparator(column, order);
  if (!isPinned) {
    return compareByColumn;
  }

  return (a, b) => {
    const aPinned = isPinned(a);
    const bPinned = isPinned(b);
    if (aPinned !== bPinned) {
      return aPinned ? -1 : 1;
    }
    return compareByColumn(a, b);
  };
};

/**
 * A new column starts ascending; the active column flips. Never cycles back to unsorted —
 * that is only the initial state of a table whose caller passes no `sort`.
 */
export const getNextSortOrder = (current: SortOrder, isActiveColumn: boolean): SortOrder =>
  isActiveColumn && current === SORT_ORDERS.ASC ? SORT_ORDERS.DESC : SORT_ORDERS.ASC;
