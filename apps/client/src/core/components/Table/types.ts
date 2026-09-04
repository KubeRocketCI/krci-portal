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
    columnSortableValuePath?: string | string[];
    customSortFn?: (a: DataType, b: DataType) => number;
  };
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

export interface SortState<DataType> {
  order: ValueOf<typeof SORT_ORDERS>;
  sortFn: (a: DataType, b: DataType) => number;
  sortBy: string;
}

export interface TableSort {
  order: ValueOf<typeof SORT_ORDERS>;
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
  reflectInURL?: boolean;
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

export interface TableProps<DataType = unknown> {
  id: string;
  data: DataType[];
  columns: TableColumn<DataType>[];
  isLoading?: boolean;
  name?: string;
  sort?: TableSort;
  selection?: TableSelection<DataType>;
  pagination?: TablePagination;
  settings?: TableSettings;
  blockerComponent?: React.ReactNode;
  emptyListComponent?: React.ReactNode;
  blockerError?: Error | null;
  errors?: Error[] | null;
  filterFunction?: (el: DataType) => boolean;
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
