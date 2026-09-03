export const SORT_ORDERS = {
  UNSET: false,
  ASC: "asc",
  DESC: "desc",
} as const;

export const SORT_DEFAULTS = {
  ORDER: SORT_ORDERS.DESC,
  SORT_BY: "name",
};

export const PAGINATION_DEFAULTS = {
  SHOW: true,
  REFLECT_IN_URL: false,
  INITIAL_PAGE: 0,
  ROWS_PER_PAGE: 10,
} as const;

export const SELECTION_DEFAULTS = {
  IS_ROW_SELECTABLE: () => true,
} as const;

const TABLE_CELL_DEFAULT_PROPS = {
  align: "left",
  colSpan: 1,
} as const;

export const TABLE_CELL_DEFAULTS = {
  SHOW: true,
  IS_FIXED: false,
  PROPS: TABLE_CELL_DEFAULT_PROPS,
} as const;

export const TABLE_SETTINGS_DEFAULTS = {
  SHOW: true,
} as const;

export const TABLE_WIDTH_DEFAULTS = {
  /** Table floor, in px. Also the floor of the seed basis. */
  TABLE_MIN_WIDTH: 1360,
  /** Per-column resize floor, in px. Overridden by `cell.minWidth`. */
  MIN: 64,
  /** Upper bound on persisted and dragged widths. Storage sanity guard, not a UX cap. */
  MAX: 4000,
  /** Expand-chevron column, in px. Not resizable. */
  EXPAND_COLUMN: 40,
  /** Selection-checkbox column, in px. Not resizable. */
  SELECTION_COLUMN: 40,
} as const;

/** Toggled on `document.body` during a column drag. Paired with the `.krci-resizing *` rule in tailwind.css. */
export const RESIZING_BODY_CLASS = "krci-resizing";
