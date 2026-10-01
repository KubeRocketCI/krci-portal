import { UnifiedPipelineRunList } from "@/modules/platform/tekton/components/UnifiedPipelineRunList";
import { pipelineRunFilterControlNames } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import { pipelineRunLabels } from "@my-project/shared";
import { routePipelineDetails } from "../../route";
import { TABLE } from "@/k8s/constants/tables";

/**
 * Merged "Pipelines" tab that combines live K8s PipelineRuns with
 * historical Tekton Results PipelineRuns for a specific pipeline.
 */
export function Pipelines() {
  const params = routePipelineDetails.useParams();

  return (
    <UnifiedPipelineRunList
      tableId={TABLE.PIPELINE_PIPELINE_RUN_LIST.id}
      tableName={TABLE.PIPELINE_PIPELINE_RUN_LIST.name}
      labels={{
        [pipelineRunLabels.pipeline]: params.name,
      }}
      filterControls={[pipelineRunFilterControlNames.SEARCH, pipelineRunFilterControlNames.STATUS]}
    />
  );
}
