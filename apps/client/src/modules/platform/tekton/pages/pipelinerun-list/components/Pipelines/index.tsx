import { UnifiedPipelineRunList } from "@/modules/platform/tekton/components/UnifiedPipelineRunList";
import { pipelineRunFilterControlNames } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
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
  const navigate = useNavigate();

  React.useEffect(() => {
    // `as never`: route Search is `Record<string, unknown>` so a generic reducer doesn't unify.
    void navigate({
      search: ((prev: Record<string, unknown>) =>
        Object.fromEntries(Object.entries(prev).filter(([key]) => key !== "page" && key !== "rowsPerPage"))) as never,
      replace: true,
    });
  }, [navigate]);

  return (
    <UnifiedPipelineRunList
      tableId={TABLE_ID}
      tableName={TABLE_NAME}
      filterControls={[
        pipelineRunFilterControlNames.SEARCH,
        pipelineRunFilterControlNames.CODEBASES,
        pipelineRunFilterControlNames.STATUS,
        pipelineRunFilterControlNames.PIPELINE_TYPE,
        pipelineRunFilterControlNames.NAMESPACES,
      ]}
      pagination={{ show: false }}
    />
  );
}
