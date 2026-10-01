import React from "react";
import type { HistoryPage, HistoryQuery } from "../../../hooks/useUnifiedPipelineRunList";

export const MAX_PAGES_PER_LOAD = 4;

interface LoadRequest {
  baseline: number;
  /** Identity of the query's first page; a different page means the query was reset. */
  firstPage: HistoryPage | undefined;
  awaitedPageCount: number;
  pageLimit: number;
}

interface UseLoadOlderRunsOptions {
  historyQuery: HistoryQuery;
  visibleHistoryCount: number;
}

/**
 * One "Load older runs" click fetches archive pages until a page adds a visible row, the
 * archive ends, the query fails or resets, or MAX_PAGES_PER_LOAD pages were fetched.
 * A page adds no visible row when its runs are still live in the cluster or fail a filter
 * the Tekton Results query cannot express.
 *
 * Decisions use rendered props only: a fetched page reaches them one render after its
 * fetch resolves, when the query owner re-renders.
 */
export function useLoadOlderRuns({ historyQuery, visibleHistoryCount }: UseLoadOlderRunsOptions) {
  const { data, hasNextPage, isFetchingNextPage, isError, fetchNextPage } = historyQuery;
  const [request, setRequest] = React.useState<LoadRequest | null>(null);
  const lastFetchId = React.useRef(0);

  const pageCount = data?.pages.length ?? 0;
  const firstPage = data?.pages[0];

  const requestPage = React.useCallback(
    (baseline: number, pageLimit: number) => {
      const fetchId = ++lastFetchId.current;
      const awaitedPageCount = pageCount + 1;
      setRequest({ baseline, firstPage, awaitedPageCount, pageLimit });
      void fetchNextPage().then((result) => {
        // Failed, cancelled, or no next page: the awaited page never renders.
        const pageAdded = (result.data?.pages.length ?? 0) >= awaitedPageCount;
        if (!pageAdded && fetchId === lastFetchId.current) setRequest(null);
      });
    },
    [fetchNextPage, firstPage, pageCount]
  );

  React.useEffect(() => {
    if (!request) return;

    if (isError || firstPage !== request.firstPage) {
      setRequest(null);
      return;
    }

    if (pageCount < request.awaitedPageCount) return;

    if (visibleHistoryCount > request.baseline || !hasNextPage || pageCount >= request.pageLimit) {
      setRequest(null);
      return;
    }

    requestPage(request.baseline, request.pageLimit);
  }, [request, isError, firstPage, pageCount, visibleHistoryCount, hasNextPage, requestPage]);

  const loadOlderRuns = React.useCallback(
    () => requestPage(visibleHistoryCount, pageCount + MAX_PAGES_PER_LOAD),
    [requestPage, visibleHistoryCount, pageCount]
  );

  return {
    loadOlderRuns,
    isLoadingOlderRuns: request !== null || isFetchingNextPage,
  };
}
