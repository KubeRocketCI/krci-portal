import { DataTable } from "@/core/components/Table";
import { SORT_ORDERS } from "@/core/components/Table/constants";
import { EmptyList } from "@/core/components/EmptyList";
import { useTektonRecordsInfiniteQuery } from "@/modules/platform/tekton/hooks/useTektonRecords";
import React from "react";
import { TektonResultsFilter } from "./components/TektonResultsFilter";
import { columnNames } from "./constants";
import { useColumns } from "./hooks/useColumns";
import { useFilteredResults } from "./hooks/useFilteredResults";
import { TektonResultsTableProps } from "./types";

export const TektonResultsTable = ({
  namespace,
  filter,
  tableId,
  hiddenColumns = [],
  contextName,
}: TektonResultsTableProps) => {
  const activeQuery = useTektonRecordsInfiniteQuery(namespace, { filter });

  const columns = useColumns({
    hiddenColumns,
    tableId,
  });

  const { filteredData, filterValues, setFilterValues } = useFilteredResults({
    data: activeQuery.data?.items || [],
  });

  const handleRefresh = React.useCallback(() => {
    activeQuery.refetch();
  }, [activeQuery]);

  const handleLoadMore = React.useCallback(() => {
    activeQuery.fetchNextPage();
  }, [activeQuery]);

  const tableSlots = React.useMemo(
    () => ({
      header: (
        <TektonResultsFilter
          values={filterValues}
          onChange={setFilterValues}
          data={activeQuery.data?.items || []}
          onRefresh={handleRefresh}
          isRefreshing={activeQuery.isRefetching}
          hasNextPage={activeQuery.hasNextPage}
          isFetchingNextPage={activeQuery.isFetchingNextPage}
          onLoadMore={handleLoadMore}
          totalLoaded={activeQuery.data?.totalLoaded ?? 0}
        />
      ),
    }),
    [
      filterValues,
      setFilterValues,
      activeQuery.data?.items,
      activeQuery.data?.totalLoaded,
      activeQuery.hasNextPage,
      activeQuery.isFetchingNextPage,
      activeQuery.isRefetching,
      handleRefresh,
      handleLoadMore,
    ]
  );

  const emptyMessage = contextName ? `No PipelineRuns found for "${contextName}"` : "No PipelineRuns found";

  return (
    <DataTable
      id={tableId}
      isLoading={activeQuery.isLoading}
      data={filteredData}
      blockerError={activeQuery.error}
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
      outlined={false}
    />
  );
};
