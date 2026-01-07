import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useInfiniteQuery } from "@tanstack/react-query";
import { TektonResult, TektonResultsListResponse } from "@my-project/shared";
import React from "react";
import { useShallow } from "zustand/react/shallow";

export interface UseTektonResultsOptions {
  filter?: string;
  pageSize?: number;
  orderBy?: string;
}

export interface NormalizedTektonResults {
  items: TektonResult[];
  hasNextPage: boolean;
  totalLoaded: number;
}

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_ORDER_BY = "create_time desc";

/**
 * Hook to fetch Tekton Results with infinite pagination support
 *
 * Uses cursor-based pagination with page_token/next_page_token from the API.
 * Implements "Load More" pattern with useInfiniteQuery.
 *
 * @param namespace - Kubernetes namespace
 * @param options - Query options (filter, pageSize, orderBy)
 * @returns React Query infinite query result with flattened items
 *
 * @example
 * const {
 *   data,
 *   isLoading,
 *   error,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useTektonResultsInfiniteQuery(namespace);
 *
 * // Load more results
 * if (hasNextPage) {
 *   fetchNextPage();
 * }
 */
export const useTektonResultsInfiniteQuery = (namespace: string, options?: UseTektonResultsOptions) => {
  const trpc = useTRPCClient();
  const { clusterName } = useClusterStore(useShallow((state) => ({ clusterName: state.clusterName })));
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const orderBy = options?.orderBy ?? DEFAULT_ORDER_BY;

  const query = useInfiniteQuery<TektonResultsListResponse, Error>({
    queryKey: [
      "tektonResults",
      "infinite",
      clusterName, // Keep in queryKey for cache separation
      namespace,
      options?.filter,
      pageSize,
      orderBy,
    ],
    queryFn: ({ pageParam }) => {
      return trpc.tektonResults.listResults.query({
        namespace,
        filter: options?.filter,
        pageSize,
        pageToken: pageParam as string | undefined,
        orderBy,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // Return undefined when there are no more pages (empty token)
      return lastPage.next_page_token || undefined;
    },
  });

  // Flatten all pages into a single items array
  const normalizedData: NormalizedTektonResults | undefined = React.useMemo(() => {
    if (!query.data) {
      return undefined;
    }

    const allItems = query.data.pages.flatMap((page) => page.results || []);

    return {
      items: allItems,
      hasNextPage: query.hasNextPage,
      totalLoaded: allItems.length,
    };
  }, [query.data, query.hasNextPage]);

  return {
    ...query,
    data: normalizedData,
  };
};
