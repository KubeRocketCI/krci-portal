import { FilterProvider } from "@/core/providers/Filter/provider";
import { isHistoryPipelineRun } from "@my-project/shared";
import React from "react";
import { useUnifiedPipelineRunList } from "../../hooks/useUnifiedPipelineRunList";
import { HistoryLoadingFooter } from "../HistoryLoadingFooter";
import { PipelineRunList } from "../PipelineRunList";
import { pipelineRunFilterProviderProps } from "../PipelineRunList/components/Filter/constants";
import {
  usePipelineRunFilter,
  usePipelineRunQueryFilters,
} from "../PipelineRunList/components/Filter/hooks/usePipelineRunFilter";
import type { PipelineRunListProps } from "../PipelineRunList/types";

export interface UnifiedPipelineRunListProps extends Pick<
  PipelineRunListProps,
  "tableId" | "tableName" | "pipelineRunTypes" | "filterControls" | "pagination"
> {
  labels?: Record<string, string>;
  enabled?: boolean;
}

/** Every filter value applies to both the live watch and the history query. */
export function UnifiedPipelineRunList(props: UnifiedPipelineRunListProps) {
  return (
    <FilterProvider {...pipelineRunFilterProviderProps}>
      <UnifiedPipelineRunListContent {...props} />
    </FilterProvider>
  );
}

function UnifiedPipelineRunListContent({ labels, enabled, ...listProps }: UnifiedPipelineRunListProps) {
  const queryFilters = usePipelineRunQueryFilters();
  const { filterFunction } = usePipelineRunFilter();

  const { mergedPipelineRuns, isLoading, isHistoryLoading, historyQuery } = useUnifiedPipelineRunList({
    labels,
    enabled,
    ...queryFilters,
  });

  // Matches the table's rows: PipelineRunList filters mergedPipelineRuns with the same filterFunction.
  const visibleHistoryCount = React.useMemo(
    () => mergedPipelineRuns.filter((run) => isHistoryPipelineRun(run) && filterFunction(run)).length,
    [mergedPipelineRuns, filterFunction]
  );

  return (
    <div className="flex flex-col gap-2">
      <PipelineRunList {...listProps} pipelineRuns={mergedPipelineRuns} isLoading={isLoading} />
      <HistoryLoadingFooter
        isHistoryLoading={isHistoryLoading}
        historyQuery={historyQuery}
        visibleHistoryCount={visibleHistoryCount}
      />
    </div>
  );
}
