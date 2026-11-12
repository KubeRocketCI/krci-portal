import { UnifiedPipelineRunList } from "@/modules/platform/tekton/components/UnifiedPipelineRunList";
import { useNavigate } from "@tanstack/react-router";
import React from "react";
import {
  PIPELINERUN_LIST_FILTER_CONTROLS,
  PIPELINERUN_LIST_TABLE_ID,
  PIPELINERUN_LIST_TABLE_NAME,
} from "../../constants";
import { PipelineRunViewTabs } from "../PipelineRunViewTabs";

const FILTER_CONTROLS = [...PIPELINERUN_LIST_FILTER_CONTROLS];

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
      tableId={PIPELINERUN_LIST_TABLE_ID}
      tableName={PIPELINERUN_LIST_TABLE_NAME}
      filterControls={FILTER_CONTROLS}
      pagination={{ show: false }}
      filterHeaderSlot={<PipelineRunViewTabs />}
    />
  );
}
