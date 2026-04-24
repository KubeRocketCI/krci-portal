import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useClusterStore } from "@/k8s/store";
import { PipelineRun, TektonResult, normalizeResultToPipelineRun, pipelineRunLabels } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import {
  buildAnnotationsFilter,
  buildCodebaseFilter,
  buildNameSearchFilter,
  buildPipelineTypeFilter,
  buildStatusFilter,
} from "@/modules/platform/tekton/utils/celFilters";
import { useInfiniteQuery } from "@tanstack/react-query";
import React from "react";
import { useShallow } from "zustand/react/shallow";

const HISTORY_PAGE_SIZE = 50;

interface HistoryPage {
  results: TektonResult[];
  nextPageToken?: string;
}

/**
 * Options for the unified pipeline run list hook.
 *
 * @param labels - K8s label selectors for filtering live PipelineRuns (via watch)
 *   and history PipelineRuns (auto-converted to a CEL filter for Tekton Results).
 *   The same label keys work for both because Tekton Results stores the labels
 *   as Result-level annotations, so `annotations["key"]` matches K8s labels.
 *   When undefined/empty, all PipelineRuns in the namespace are fetched.
 *
 * @param enabled - Whether the K8s watch and history queries are enabled.
 *   Defaults to true. Set to false to defer data fetching (e.g., waiting for route params).
 *
 * @param searchTerm - Debounced search term for server-side name filtering via Tekton Results CEL.
 *
 * @param status - K8s condition status value ("true" | "false" | "unknown" | "all").
 *   Translated to Tekton Results `summary.status` CEL filter for history.
 *   Live K8s items are filtered in-memory by the FilterProvider matchFunction.
 *
 * @param pipelineType - Pipeline type label value (e.g. "build", "review", "deploy").
 *   Applied as a K8s label selector for the live watch and as a CEL annotation filter for history.
 *
 * @param codebases - List of codebase names to filter by.
 *   Applied as a CEL annotation OR-filter for history.
 *   Live K8s items with a single codebase also get a label selector.
 */
interface UseUnifiedPipelineRunListOptions {
  labels?: Record<string, string>;
  enabled?: boolean;
  searchTerm?: string;
  status?: string;
  pipelineType?: string;
  codebases?: string[];
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
 * Uses the lightweight `getPipelineRunResults` endpoint which queries the
 * Tekton Results `results` table (annotations + summary) instead of the
 * heavyweight `getPipelineRunRecords` endpoint (full JSONB blobs).
 *
 * Merge strategy:
 * 1. Watch live PipelineRuns via usePipelineRunWatchList (with optional label selectors)
 * 2. Fetch history from Tekton Results via getPipelineRunResults (CEL filter auto-derived from labels)
 * 3. Normalize Result objects to K8s PipelineRun type via normalizeResultToPipelineRun
 * 4. Deduplicate: filter out history items whose name exists in the live set (live wins)
 * 5. Concatenate live + filtered history, sorted by creation time (newest first)
 */
export function useUnifiedPipelineRunList(options?: UseUnifiedPipelineRunListOptions): UseUnifiedPipelineRunListResult {
  const { labels, enabled = true, searchTerm, status, pipelineType, codebases } = options ?? {};
  const trpc = useTRPCClient();
  const { namespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  // Merge caller-provided labels with pipelineType so the K8s watch is pre-filtered
  // when a single type is selected. Multi-value codebase filter can't be expressed as
  // K8s equality label selectors, so live items are handled by the FilterProvider matchFunction.
  const watchLabels = React.useMemo(() => {
    const merged: Record<string, string> = { ...labels };
    if (pipelineType && pipelineType !== "all") merged[pipelineRunLabels.pipelineType] = pipelineType;
    if (codebases && codebases.length === 1) merged[pipelineRunLabels.codebase] = codebases[0];
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels serialized; scalar deps are direct
  }, [labels && Object.entries(labels).flat().join("\0"), pipelineType, codebases?.join("\0")]);

  // Live K8s PipelineRuns (label selectors applied by the watch)
  const pipelineRunsWatch = usePipelineRunWatchList({
    labels: watchLabels,
    queryOptions: { enabled },
  });

  // Derive CEL filter from all active filter values for the Tekton Results history query.
  // Changing any filter resets pagination (queryKey changes → page 1 of filtered results).
  const celFilter = React.useMemo(() => {
    const labelFilter = labels && Object.keys(labels).length > 0 ? buildAnnotationsFilter(labels) : undefined;
    const nameFilter = searchTerm ? buildNameSearchFilter(searchTerm) : undefined;
    const statusFilter = buildStatusFilter(status ?? "");
    const typeFilter = buildPipelineTypeFilter(pipelineType ?? "");
    const codebaseFilter = buildCodebaseFilter(codebases ?? []);
    const parts = [labelFilter, nameFilter, statusFilter, typeFilter, codebaseFilter].filter(Boolean);
    return parts.length > 0 ? parts.join(" && ") : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels/codebases serialized to avoid object identity churn
  }, [labels && Object.entries(labels).flat().join("\0"), searchTerm, status, pipelineType, codebases?.join("\0")]);

  // History PipelineRuns from Tekton Results (lightweight results table)
  const historyQuery = useInfiniteQuery<HistoryPage, Error>({
    queryKey: ["tektonResults", "pipelineRunResults", clusterName, namespace, celFilter],
    queryFn: ({ pageParam }) => {
      return trpc.tektonResults.getPipelineRunResults.query({
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

  // Normalize history Result objects into K8s PipelineRun type.
  // Separated from merge so it only re-runs when history data changes (not on live updates).
  const normalizedHistory = React.useMemo((): PipelineRun[] => {
    const allResults = historyQuery.data?.pages.flatMap((page) => page.results) ?? [];
    return allResults.map((result) => normalizeResultToPipelineRun(result, namespace));
  }, [historyQuery.data, namespace]);

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
