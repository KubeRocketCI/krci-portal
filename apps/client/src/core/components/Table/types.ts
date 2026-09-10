import React from "react";
import { ValueOf } from "@/core/types/global";
import { SORT_ORDERS } from "./constants";

// Helper type to allow data-* attributes
export type PropsWithHTMLDataAttrs = React.HTMLAttributes<HTMLDivElement> & {
  [key: `data-${string}`]: string | undefined;
};

// Custom type to replace MUI TableCellProps
export type TableCellProps = React.HTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "center" | "right" | "justify";
  colSpan?: number;
  rowSpan?: number;
  scope?: "col" | "row" | "colgroup" | "rowgroup";
};

/** A column declares at most one sort key. Declaring none leaves the column unsortable. */
type ColumnSortKey<DataType> =
  | {
      /** Lodash path to the sort key. */
      columnSortableValuePath: string | string[];
      columnSortableValue?: never;
      customSortFn?: never;
    }
  | {
      /**
       * Sort key for a value that is computed rather than read from a path — a fallback
       * between fields, a derived rank, a length. Compared exactly like a path value.
       */
      columnSortableValue: (row: DataType) => unknown;
      columnSortableValuePath?: never;
      customSortFn?: never;
    }
  | {
      /**
       * Ascending comparator. Reach for it only when rows compare pairwise, with no single sort key.
       * Descending negates the whole result: no direction-invariant rules such as pinning or grouping.
       * Pinning is the table's `isRowPinned`.
       */
      customSortFn: (a: DataType, b: DataType) => number;
      columnSortableValuePath?: never;
      columnSortableValue?: never;
    }
  | {
      columnSortableValuePath?: never;
      columnSortableValue?: never;
      customSortFn?: never;
    };

export interface TableColumn<DataType> {
  id: string;
  label: string | React.ReactElement;
  data: {
    render: ({
      data,
      meta,
    }: {
      data: DataType;
      meta?: {
        selectionLength: number;
      };
    }) => React.ReactElement | string | number | undefined | null;
  } & ColumnSortKey<DataType>;
  cell: {
    /**
     * Relative weight, normalised against the visible columns' sum. Not a percent —
     * column sets are not required to total 100. Only ratios matter: `[16, 8, 12]`
     * and `[32, 16, 24]` lay out identically.
     */
    baseWidth: number;
    /** Resize floor in px. Defaults to `TABLE_WIDTH_DEFAULTS.MIN`. */
    minWidth?: number;
    /**
     * Set to `false` to drop the drag handle. The column still takes its proportional
     * share and still reflows with the container. Defaults to `true`.
     */
    resizable?: boolean;
    /** Code default. A saved table-settings entry for this column overrides it in the shell. */
    show?: boolean;
    isFixed?: boolean;
    colSpan?: number;
    props?: TableCellProps;
  };
}

export interface ColumnResizeReset {
  /** Restores every column to its seed width and clears persisted widths. */
  all: () => void;
  /** True once any column is pinned. Pinning happens at `pointerdown`; a zero-delta release unpins. */
  isAvailable: boolean;
}

export type SortOrder = ValueOf<typeof SORT_ORDERS>;

export interface TableSort {
  order: SortOrder;
  /** A `columns[].id`, not a data path. Unmatched ids render the table unsorted. */
  sortBy: string;
}

export interface TableSelection<DataType> {
  selected?: string[];
  isRowSelectable?: (row: DataType) => boolean;
  isRowSelected?: (row: DataType) => boolean;
  handleSelectAll?: (event: React.ChangeEvent<HTMLInputElement>, paginatedItems: DataType[]) => void;
  handleSelectRow?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, row: DataType) => void;
  renderSelectionInfo?: (selectedCount: number) => React.ReactElement;
}

export interface TablePagination {
  show?: boolean;
  rowsPerPage?: number;
  initialPage?: number;
}

export interface TableSettings {
  show: boolean;
}
export interface TableExpandable<DataType> {
  expandedRowRender: (row: DataType) => React.ReactNode;
  expandedRowIds?: Set<string | number>;
  onExpandedRowsChange?: (expandedIds: Set<string | number>) => void;
  getRowId: (row: DataType) => string | number;
}

/**
 * How a server-paged caller reports the size of the result set. A total-based API sets
 * `totalCount` (`undefined` while it loads); a cursor-based API sets `hasNextPage`.
 */
export type ServerTotal =
  | { totalCount: number | undefined; hasNextPage?: never }
  | { totalCount?: never; hasNextPage: boolean };

export type ServerTablePagination = {
  show?: boolean;
  /** 0-indexed. Owned by the caller. */
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  /** Receives the new page size. Must also reset the page to 0; the table emits no separate page change. */
  onRowsPerPageChange?: (rowsPerPage: number) => void;
} & ServerTotal;

export interface TableBaseProps<DataType> {
  id: string;
  data: DataType[];
  columns: TableColumn<DataType>[];
  isLoading?: boolean;
  name?: string;
  /** Omit for source order. Set it only when the named column is known to exist. */
  sort?: TableSort;
  /**
   * Rows that rank first under every column, both directions and an unset sort.
   * Memoize it: a new identity re-sorts.
   */
  isRowPinned?: (row: DataType) => boolean;
  settings?: TableSettings;
  blockerComponent?: React.ReactNode;
  emptyListComponent?: React.ReactNode;
  blockerError?: Error | null;
  errors?: Error[] | null;
  handleRowClick?: (event: React.MouseEvent<HTMLTableRowElement>, row: DataType) => void;
  expandable?: TableExpandable<DataType>;
  slots?: {
    header?: {
      component: React.ReactElement;
      /** HTML attributes to pass to the header wrapper element (e.g., data-tour for PageGuide) */
      slotProps?: PropsWithHTMLDataAttrs;
    };
    footer?: {
      component: React.ReactElement;
      /** HTML attributes to pass to the footer wrapper element (e.g., data-tour for PageGuide) */
      slotProps?: PropsWithHTMLDataAttrs;
    };
  };
  outlined?: boolean;
  /** HTML attributes to pass to the root container element (e.g., data-tour for PageGuide) */
  containerProps?: PropsWithHTMLDataAttrs;
}

/** `data` is the full set. The shell filters, sorts and slices it. */
export interface DataTableClientProps<DataType> extends TableBaseProps<DataType> {
  mode?: "client";
  pagination?: TablePagination;
  selection?: TableSelection<DataType>;
  filterFunction?: (el: DataType) => boolean;
}

/** `data` is one page. The caller owns `page` and `rowsPerPage`; the shell renders the page unsliced. */
export interface DataTableServerProps<DataType> extends TableBaseProps<DataType> {
  mode: "server";
  pagination: ServerTablePagination;
  /** Applies to the visible page only. */
  sort?: TableSort;
  selection?: never;
  filterFunction?: never;
}

/** `mode` is fixed per table instance; changing it remounts the shell and resets in-memory sort and column state. */
export type TableProps<DataType = unknown> = DataTableClientProps<DataType> | DataTableServerProps<DataType>;
