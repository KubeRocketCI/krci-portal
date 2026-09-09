import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";

// Do not rename: stored preferences are keyed by this string. Distinct from "tableSettings",
// which holds per-column widths and visibility.
const STORAGE_KEY = "settings";

const DEFAULT_ROWS_PER_PAGE_OPTIONS = [10, 20, 25, 50, 100];

const isUsableRowCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

// Never throws: a corrupt, absent, array or non-object entry reads as `{}`.
const readEnvelope = (): Record<string, unknown> => {
  const stored: unknown = LOCAL_STORAGE_SERVICE.getItem(STORAGE_KEY);

  return typeof stored === "object" && stored !== null && !Array.isArray(stored)
    ? (stored as Record<string, unknown>)
    : {};
};

/**
 * The stored page size, or `fallback` when nothing usable is stored.
 *
 * The fallback is a parameter because page sizes differ per table: the security pages default to
 * 25, every other table to `PAGINATION_DEFAULTS.ROWS_PER_PAGE`.
 */
export const getDefaultRowsPerPage = (fallback: number): number => {
  const stored = readEnvelope().tableDefaultRowsPerPage;

  return isUsableRowCount(stored) ? stored : fallback;
};

export const getRowsPerPageOptions = (): number[] => {
  const stored = readEnvelope().tableRowsPerPageOptions;
  const usable = Array.isArray(stored) ? stored.filter(isUsableRowCount) : [];

  return usable.length > 0 ? usable : [...DEFAULT_ROWS_PER_PAGE_OPTIONS];
};

/** Merges into the envelope; never replaces it. A value that is not a positive integer is a no-op. */
export const setDefaultRowsPerPage = (rows: number): void => {
  if (!isUsableRowCount(rows)) {
    return;
  }

  LOCAL_STORAGE_SERVICE.setItem(STORAGE_KEY, { ...readEnvelope(), tableDefaultRowsPerPage: rows });
};
