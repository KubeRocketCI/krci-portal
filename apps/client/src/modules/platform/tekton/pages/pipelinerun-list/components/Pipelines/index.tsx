import { PipelineRunList } from "@/modules/platform/tekton/components/PipelineRunList";
import { PATH_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { useUnifiedPipelineRunList } from "@/modules/platform/tekton/hooks/useUnifiedPipelineRunList";
import { HistoryLoadingFooter } from "@/modules/platform/tekton/components/HistoryLoadingFooter";
import { FilterProvider } from "@/core/providers/Filter/provider";
import {
  CODEBASE_DIVIDER_VALUE,
  defaultPipelineRunFilterValues,
  matchFunctions,
  pipelineRunFilterControlNames,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import {
  useDebouncedPipelineRunSearch,
  usePipelineRunFilter,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/hooks/usePipelineRunFilter";
import { useStore } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import React from "react";

const TABLE_ID = "pipelineruns-unified";
const TABLE_NAME = "Unified Pipeline Run List";

/**
 * Merged "Pipelines" tab that combines live K8s PipelineRuns with
 * historical Tekton Results PipelineRuns for all namespaces.
 *
 * No label filter on K8s watch and no CEL filter on history -- shows all pipeline runs.
 */
export function Pipelines() {
  return (
    <FilterProvider matchFunctions={matchFunctions} syncWithUrl defaultValues={defaultPipelineRunFilterValues}>
      <PipelinesContent />
    </FilterProvider>
  );
}

function PipelinesContent() {
  const debouncedSearch = useDebouncedPipelineRunSearch();
  const { form } = usePipelineRunFilter();
  const navigate = useNavigate();

  React.useEffect(() => {
    // `as never`: route Search is `Record<string, unknown>` so a generic reducer doesn't unify.
    void navigate({
      search: ((prev: Record<string, unknown>) =>
        Object.fromEntries(Object.entries(prev).filter(([key]) => key !== "page" && key !== "rowsPerPage"))) as never,
      replace: true,
    });
  }, [navigate]);

  const pipelineType = useStore(form.store, (s) => s.values.pipelineType);
  const status = useStore(form.store, (s) => s.values.status);
  const codebases = useStore(form.store, (s) => s.values.codebases);

  // Guard against a crafted URL injecting the sentinel into URL-synced filter state.
  const sanitizedCodebases = React.useMemo(() => codebases.filter((c) => c !== CODEBASE_DIVIDER_VALUE), [codebases]);

  const { mergedPipelineRuns, isLoading, isHistoryLoading, historyQuery } = useUnifiedPipelineRunList({
    searchTerm: debouncedSearch,
    pipelineType,
    status,
    codebases: sanitizedCodebases,
  });

  return (
    <div className="flex flex-col gap-2">
      <PipelineRunList
        tableId={TABLE_ID}
        tableName={TABLE_NAME}
        pipelineRuns={mergedPipelineRuns}
        isLoading={isLoading}
        filterControls={[
          pipelineRunFilterControlNames.SEARCH,
          pipelineRunFilterControlNames.CODEBASES,
          pipelineRunFilterControlNames.STATUS,
          pipelineRunFilterControlNames.PIPELINE_TYPE,
          pipelineRunFilterControlNames.NAMESPACES,
        ]}
        detailRoutePath={PATH_PIPELINERUN_DETAILS_FULL}
        pagination={{ show: false }}
      />
      <HistoryLoadingFooter isHistoryLoading={isHistoryLoading} historyQuery={historyQuery} />
    </div>
  );
}
