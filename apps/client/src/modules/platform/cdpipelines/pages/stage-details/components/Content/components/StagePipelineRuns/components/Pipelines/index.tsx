import { UnifiedPipelineRunList } from "@/modules/platform/tekton/components/UnifiedPipelineRunList";
import { pipelineRunFilterControlNames } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import { getStageResourceName, pipelineRunLabels, pipelineType } from "@my-project/shared";
import { routeStageDetails } from "../../../../../../route";

const TABLE_ID = "stage-pipelines-unified";
const TABLE_NAME = "Unified Pipeline Run List";

/**
 * Merged "Pipelines" tab that combines live K8s PipelineRuns with
 * historical Tekton Results PipelineRuns for a specific stage.
 */
export function Pipelines() {
  const params = routeStageDetails.useParams();

  return (
    <UnifiedPipelineRunList
      tableId={TABLE_ID}
      tableName={TABLE_NAME}
      labels={{
        [pipelineRunLabels.cdPipeline]: params.cdPipeline,
        [pipelineRunLabels.cdStage]: getStageResourceName(params.cdPipeline, params.stage),
      }}
      pipelineRunTypes={[pipelineType.deploy, pipelineType.clean]}
      filterControls={[
        pipelineRunFilterControlNames.SEARCH,
        pipelineRunFilterControlNames.PIPELINE_TYPE,
        pipelineRunFilterControlNames.STATUS,
      ]}
    />
  );
}
