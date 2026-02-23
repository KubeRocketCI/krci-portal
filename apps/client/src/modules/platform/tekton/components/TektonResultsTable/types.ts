import { TektonResult, TektonResultStatus } from "@my-project/shared";
import { columnNames } from "./constants";

/** Column name type - derived from columnNames for type safety */
export type ColumnName = (typeof columnNames)[keyof typeof columnNames];

/** Filter values for TektonResults client-side filtering */
export interface TektonResultsFilterValues {
  status: TektonResultStatus | "all";
  pipelineType: string;
  codebases: string[];
  codebaseBranches: string[];
}

/** Filter controls to show in the table */
export type TektonResultsFilterControl = "status" | "pipelineType" | "codebases" | "codebaseBranches";

/** Props for TektonResultsTable component */
export interface TektonResultsTableProps {
  /** Kubernetes namespace to query */
  namespace: string;
  /** CEL filter expression for server-side filtering */
  filter?: string;
  /** Unique table ID for settings persistence */
  tableId: string;
  /** Columns to hide from the table */
  hiddenColumns?: ColumnName[];
  /** Context name shown in loading/empty states (e.g., pipeline name) */
  contextName?: string;
  /** Filter controls to show (default: all) */
  filterControls?: TektonResultsFilterControl[];
}

/** Props for TektonResultsFilter component (controlled) */
export interface TektonResultsFilterProps {
  /** Current filter values (controlled component) */
  values: TektonResultsFilterValues;
  /** Callback when filter values change */
  onChange: (values: TektonResultsFilterValues) => void;
  /** Data for extracting dynamic filter options (codebases) */
  data: TektonResult[];
  /** Callback to refresh/refetch data */
  onRefresh: () => void;
  /** Whether data is currently being refreshed */
  isRefreshing: boolean;
  /** Whether there are more items to load */
  hasNextPage: boolean;
  /** Whether the next page is currently being fetched */
  isFetchingNextPage: boolean;
  /** Function to fetch the next page */
  onLoadMore: () => void;
  /** Total number of items currently loaded */
  totalLoaded: number;
  /** Filter controls to show */
  filterControls: TektonResultsFilterControl[];
}

/** Props for useColumns hook */
export interface UseColumnsOptions {
  /** Columns to hide from the table */
  hiddenColumns?: ColumnName[];
  /** Table ID for settings persistence */
  tableId: string;
}
