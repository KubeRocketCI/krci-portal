import { DataTable } from "@/core/components/Table";
import { SORT_ORDERS } from "@/core/components/Table/constants";
import { EmptyList } from "@/core/components/EmptyList";
import { useTektonResultsInfiniteQuery } from "@/modules/platform/tekton/hooks/useTektonResults";
import React from "react";
import { TektonResultsFilter } from "./components/TektonResultsFilter";
import { columnNames } from "./constants";
import { useColumns } from "./hooks/useColumns";
import { useFilteredResults } from "./hooks/useFilteredResults";
import { TektonResultsTableProps } from "./types";

/**
 * Reusable TektonResults table component
 *
 * Displays PipelineRun history from Tekton Results API with:
 * - Server-side filtering via CEL expressions
 * - Client-side filtering (status, type, codebases)
 * - Infinite pagination (Load More)
 * - Configurable columns (can hide specific columns)
 * - Persistent table settings
 *
 * @example
 * // Show all results for a namespace
 * <TektonResultsTable namespace="my-namespace" tableId="all-results" />
 *
 * @example
 * // Show results filtered by pipeline name (History tab)
 * <TektonResultsTable
 *   namespace="my-namespace"
 *   filter="annotations['tekton.dev/pipeline'] == 'my-pipeline'"
 *   tableId="pipeline-history"
 *   hiddenColumns={["pipeline"]}
 *   contextName="my-pipeline"
 * />
 */
export const TektonResultsTable = ({
  namespace,
  filter,
  tableId,
  hiddenColumns = [],
  contextName,
}: TektonResultsTableProps) => {
  const resultsQuery = useTektonResultsInfiniteQuery(namespace, {
    filter,
  });

  const columns = useColumns({
    hiddenColumns,
    tableId,
  });

  // Client-side filtering
  const { filteredData, filterValues, setFilterValues } = useFilteredResults({
    data: resultsQuery.data?.items || [],
  });

  const handleRefresh = React.useCallback(() => {
    resultsQuery.refetch();
  }, [resultsQuery]);

  const handleLoadMore = React.useCallback(() => {
    resultsQuery.fetchNextPage();
  }, [resultsQuery]);

  const tableSlots = React.useMemo(
    () => ({
      header: (
        <TektonResultsFilter
          values={filterValues}
          onChange={setFilterValues}
          data={resultsQuery.data?.items || []}
          onRefresh={handleRefresh}
          isRefreshing={resultsQuery.isRefetching}
          hasNextPage={resultsQuery.hasNextPage}
          isFetchingNextPage={resultsQuery.isFetchingNextPage}
          onLoadMore={handleLoadMore}
          totalLoaded={resultsQuery.data?.totalLoaded ?? 0}
        />
      ),
    }),
    [
      filterValues,
      setFilterValues,
      resultsQuery.data?.items,
      resultsQuery.data?.totalLoaded,
      resultsQuery.hasNextPage,
      resultsQuery.isFetchingNextPage,
      resultsQuery.isRefetching,
      handleRefresh,
      handleLoadMore,
    ]
  );

  // Build empty list message
  const emptyMessage = contextName
    ? `No PipelineRuns found for "${contextName}"`
    : "No PipelineRuns found";

  return (
    <DataTable
      id={tableId}
      isLoading={resultsQuery.isLoading}
      data={filteredData}
      blockerError={resultsQuery.error}
      columns={columns}
      sort={{
        order: SORT_ORDERS.DESC,
        sortBy: columnNames.CREATED,
      }}
      emptyListComponent={<EmptyList missingItemName={emptyMessage} />}
      settings={{
        show: true,
      }}
      pagination={{
        show: true,
        rowsPerPage: 20,
      }}
      slots={tableSlots}
    />
  );
};
