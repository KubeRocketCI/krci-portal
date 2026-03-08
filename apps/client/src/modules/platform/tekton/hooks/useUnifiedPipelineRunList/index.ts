import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useClusterStore } from "@/k8s/store";
import {
  PipelineRun,
  normalizeHistoryPipelineRun,
  DecodedPipelineRun,
  tektonResultAnnotations,
} from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { buildLabelsFilter } from "@/modules/platform/tekton/utils/celFilters";
import { useInfiniteQuery } from "@tanstack/react-query";
import React from "react";
import { useShallow } from "zustand/react/shallow";

const HISTORY_PAGE_SIZE = 50;

interface HistoryPage {
  pipelineRuns: DecodedPipelineRun[];
  nextPageToken?: string;
}

/**
 * Options for the unified pipeline run list hook.
 *
 * @param labels - K8s label selectors for filtering live PipelineRuns (via watch)
 *   and history PipelineRuns (auto-converted to a CEL filter for Tekton Results).
 *   The same label keys work for both because Tekton Results stores the full
 *   PipelineRun resource, so `data.metadata.labels` matches K8s labels.
 *   When undefined/empty, all PipelineRuns in the namespace are fetched.
 *
 * @param enabled - Whether the K8s watch and history queries are enabled.
 *   Defaults to true. Set to false to defer data fetching (e.g., waiting for route params).
 */
interface UseUnifiedPipelineRunListOptions {
  labels?: Record<string, string>;
  enabled?: boolean;
}

/**
 * Return value of the useUnifiedPipelineRunList hook.
 */
export interface UseUnifiedPipelineRunListResult {
  /** Merged and deduplicated pipeline runs sorted by creation time (newest first). */
  mergedPipelineRuns: PipelineRun[];
  /** True when both live and history sources are still loading (show full skeleton). */
  isLoading: boolean;
  /** True when live data is ready but history is still loading (show subtle indicator). */
  isHistoryLoading: boolean;
  /** The underlying infinite query for history data -- exposes pagination, error states, etc. */
  historyQuery: ReturnType<typeof useInfiniteQuery<HistoryPage, Error>>;
}

/**
 * Shared hook that merges live K8s PipelineRuns with historical Tekton Results PipelineRuns.
 *
 * Internally manages both the K8s watch and the Tekton Results history query,
 * so callers only need to provide label selectors — the hook handles the rest.
 *
 * Merge strategy:
 * 1. Watch live PipelineRuns via usePipelineRunWatchList (with optional label selectors)
 * 2. Fetch history PipelineRuns from Tekton Results (CEL filter auto-derived from labels)
 * 3. Normalize history data to K8s PipelineRun type
 * 4. Annotate history items with historySource marker
 * 5. Deduplicate: filter out history items whose name exists in the live set (live wins)
 * 6. Concatenate live + filtered history, sorted by creation time (newest first)
 */
export function useUnifiedPipelineRunList(options?: UseUnifiedPipelineRunListOptions): UseUnifiedPipelineRunListResult {
  const { labels, enabled = true } = options ?? {};
  const trpc = useTRPCClient();
  const { namespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  // Live K8s PipelineRuns (label selectors applied by the watch)
  const pipelineRunsWatch = usePipelineRunWatchList({
    labels,
    queryOptions: { enabled },
  });

  // Derive CEL filter from the same labels used for the K8s watch
  const celFilter = React.useMemo(
    () => (labels && Object.keys(labels).length > 0 ? buildLabelsFilter(labels) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable when label values don't change
    [labels && Object.entries(labels).flat().join("\0")]
  );

  // History PipelineRuns from Tekton Results
  const historyQuery = useInfiniteQuery<HistoryPage, Error>({
    queryKey: ["tektonResults", "pipelineRunRecords", clusterName, namespace, celFilter],
    queryFn: ({ pageParam }) => {
      return trpc.tektonResults.getPipelineRunRecords.query({
        namespace,
        pageSize: HISTORY_PAGE_SIZE,
        pageToken: pageParam as string | undefined,
        filter: celFilter,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled,
  });

  // Normalize history pages into K8s PipelineRun type with historySource annotation.
  // Separated from merge so it only re-runs when history data changes (not on live updates).
  const normalizedHistory = React.useMemo((): PipelineRun[] => {
    const allHistoryDecoded = historyQuery.data?.pages.flatMap((page) => page.pipelineRuns) ?? [];
    return allHistoryDecoded.map((decoded) => {
      const base = normalizeHistoryPipelineRun(decoded);
      return {
        ...base,
        metadata: {
          ...base.metadata,
          annotations: {
            ...base.metadata.annotations,
            [tektonResultAnnotations.historySource]: "true",
          },
        },
      };
    });
  }, [historyQuery.data]);

  // Merge live + normalized history data
  const mergedPipelineRuns = React.useMemo((): PipelineRun[] => {
    const live = pipelineRunsWatch.data.array ?? [];

    // Build set of live PipelineRun names for deduplication
    const liveNameSet = new Set(live.map((pr) => pr.metadata.name));

    // Filter out history items that exist in the live set
    const filteredHistory = normalizedHistory.filter((pr) => !liveNameSet.has(pr.metadata.name));

    // Concatenate and sort by creation time (newest first)
    const merged = [...live, ...filteredHistory];
    merged.sort((a, b) => {
      const aTime = a.metadata.creationTimestamp || a.status?.startTime || "";
      const bTime = b.metadata.creationTimestamp || b.status?.startTime || "";
      const aMs = new Date(aTime).getTime() || 0;
      const bMs = new Date(bTime).getTime() || 0;
      return bMs - aMs;
    });

    return merged;
  }, [pipelineRunsWatch.data.array, normalizedHistory]);

  // Show table loading skeleton only when both sources are still loading
  const isLoading = !pipelineRunsWatch.isReady && historyQuery.isLoading;

  // Show a subtle indicator when live data is ready but history is still loading
  const isHistoryLoading = pipelineRunsWatch.isReady && historyQuery.isLoading;

  return {
    mergedPipelineRuns,
    isLoading,
    isHistoryLoading,
    historyQuery,
  };
}
