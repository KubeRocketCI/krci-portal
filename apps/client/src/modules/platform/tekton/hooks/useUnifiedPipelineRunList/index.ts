import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useClusterStore } from "@/k8s/store";
import {
  PipelineRun,
  TektonResult,
  isSafeCELStringContent,
  mergeLiveAndHistoryPipelineRuns,
  normalizeResultToPipelineRun,
  pipelineRunLabels,
} from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import {
  buildAnnotationsFilter,
  buildCodebaseFilter,
  buildNameSearchFilter,
  buildPipelineTypeFilter,
  isCodebaseInPayloadType,
} from "@/modules/platform/tekton/utils/celFilters";
import {
  PipelineRunStatusFilterValue,
  resolvePipelineRunStatusFilter,
} from "@/modules/platform/tekton/utils/pipelineRunStatusFilter";
import { useInfiniteQuery } from "@tanstack/react-query";
import React from "react";
import { useShallow } from "zustand/react/shallow";

const HISTORY_PAGE_SIZE = 50;

export interface HistoryPage {
  results: TektonResult[];
  nextPageToken?: string;
}

/**
 * Live items are filtered in memory by the FilterProvider matchFunction.
 *
 * @param searchTerm - Debounced by the caller.
 * @param pipelineType - Label value, e.g. "build", "review", "deploy".
 * @param codebases - Not applied as a label selector or CEL filter for the `deploy` and `clean` pipeline types.
 * @param namespaces - History covers the default namespace only; a selection without it disables the history query.
 */
export interface PipelineRunQueryFilters {
  searchTerm?: string;
  status?: PipelineRunStatusFilterValue;
  pipelineType?: string;
  codebases?: string[];
  namespaces?: string[];
}

/**
 * @param labels - Tekton Results stores PipelineRun labels as Result annotations; history filters on `annotations["key"]`.
 */
interface UseUnifiedPipelineRunListOptions extends PipelineRunQueryFilters {
  labels?: Record<string, string>;
  enabled?: boolean;
}

export interface UseUnifiedPipelineRunListResult {
  mergedPipelineRuns: PipelineRun[];
  isLoading: boolean;
  isHistoryLoading: boolean;
  historyQuery: ReturnType<typeof useInfiniteQuery<HistoryPage, Error>>;
}

export type HistoryQuery = UseUnifiedPipelineRunListResult["historyQuery"];

/**
 * Live K8s PipelineRuns merged with Tekton Results history.
 * History reads the Tekton Results `results` table (annotations + summary), not full records.
 */
export function useUnifiedPipelineRunList(options?: UseUnifiedPipelineRunListOptions): UseUnifiedPipelineRunListResult {
  const { labels, enabled = true, searchTerm, status, pipelineType, codebases, namespaces } = options ?? {};
  const trpc = useTRPCClient();
  const { namespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  // Multi-codebase selection can't be expressed as K8s equality label selectors, so it's
  // handled by the FilterProvider matchFunction instead of the watch.
  const watchLabels = React.useMemo(() => {
    const merged: Record<string, string> = { ...labels };
    if (pipelineType && pipelineType !== "all") merged[pipelineRunLabels.pipelineType] = pipelineType;
    if (!isCodebaseInPayloadType(pipelineType) && codebases && codebases.length === 1) {
      merged[pipelineRunLabels.codebase] = codebases[0];
    }
    return merged;
  }, [labels, pipelineType, codebases]);

  const pipelineRunsWatch = usePipelineRunWatchList({
    labels: watchLabels,
    queryOptions: { enabled },
  });

  const statusFilter = React.useMemo(() => resolvePipelineRunStatusFilter(status ?? "all"), [status]);

  // An unsafe search term disables history; dropping the clause would match every run.
  const searchTermIsSafe = isSafeCELStringContent(searchTerm?.trim() ?? "");

  const celFilter = React.useMemo(() => {
    const labelFilter = labels && Object.keys(labels).length > 0 ? buildAnnotationsFilter(labels) : undefined;
    const nameFilter = searchTerm ? buildNameSearchFilter(searchTerm) : undefined;
    const typeFilter = buildPipelineTypeFilter(pipelineType ?? "");
    const codebaseFilter = buildCodebaseFilter(codebases ?? [], pipelineType);
    const parts = [labelFilter, nameFilter, statusFilter.historyFilter, typeFilter, codebaseFilter].filter(Boolean);
    return parts.length > 0 ? parts.join(" && ") : undefined;
  }, [labels, searchTerm, statusFilter, pipelineType, codebases]);

  const historyEnabled =
    enabled &&
    searchTermIsSafe &&
    statusFilter.historyEnabled &&
    (!namespaces?.length || namespaces.includes(namespace));

  // Key includes `historyEnabled`: filter states with and without history can share a CEL filter.
  const historyQuery = useInfiniteQuery<HistoryPage, Error>({
    queryKey: ["tektonResults", "pipelineRunResults", clusterName, namespace, celFilter, historyEnabled],
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
    enabled: historyEnabled,
  });

  const normalizedHistory = React.useMemo((): PipelineRun[] => {
    const allResults = historyQuery.data?.pages.flatMap((page) => page.results) ?? [];
    return allResults.map((result) => normalizeResultToPipelineRun(result, namespace));
  }, [historyQuery.data, namespace]);

  const mergedPipelineRuns = React.useMemo(
    (): PipelineRun[] => mergeLiveAndHistoryPipelineRuns(pipelineRunsWatch.data.array ?? [], normalizedHistory),
    [pipelineRunsWatch.data.array, normalizedHistory]
  );

  const isLoading = !pipelineRunsWatch.isReady && historyQuery.isLoading;
  const isHistoryLoading = pipelineRunsWatch.isReady && historyQuery.isLoading;

  return {
    mergedPipelineRuns,
    isLoading,
    isHistoryLoading,
    historyQuery,
  };
}
