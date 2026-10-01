import { UnifiedPipelineRunList } from "@/modules/platform/tekton/components/UnifiedPipelineRunList";
import { pipelineRunFilterControlNames } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import { pipelineRunLabels, pipelineType } from "@my-project/shared";
import { routeProjectDetails } from "../../../../route";
import { TABLE } from "@/k8s/constants/tables";

/**
 * Merged "Pipelines" tab that combines live K8s PipelineRuns with
 * historical Tekton Results PipelineRuns for a specific codebase.
 */
export function Pipelines() {
  const params = routeProjectDetails.useParams();
  const codebaseName = params.name;

  return (
    <UnifiedPipelineRunList
      tableId={TABLE.CODEBASE_PIPELINE_RUN_LIST.id}
      tableName={TABLE.CODEBASE_PIPELINE_RUN_LIST.name}
      labels={{
        [pipelineRunLabels.codebase]: codebaseName,
      }}
      enabled={!!codebaseName}
      pipelineRunTypes={[pipelineType.review, pipelineType.build]}
      filterControls={[
        pipelineRunFilterControlNames.SEARCH,
        pipelineRunFilterControlNames.CODEBASE_BRANCHES,
        pipelineRunFilterControlNames.PIPELINE_TYPE,
        pipelineRunFilterControlNames.STATUS,
      ]}
    />
  );
}
