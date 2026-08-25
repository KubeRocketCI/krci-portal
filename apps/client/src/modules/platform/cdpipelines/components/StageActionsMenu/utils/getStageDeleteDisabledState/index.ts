import { getDisabledState } from "@/core/utils/createResourceAction";
import { DefaultPermissionListCheckResult, Stage } from "@my-project/shared";

/**
 * Resolve the disabled state of a Stage's Delete action.
 *
 * Deletable only when the Stage holds the highest `spec.order` in its own CD pipeline.
 * A CD pipeline keeps at least one Stage.
 * `allStages` may be namespace-wide; scoping to `spec.cdPipeline` is mandatory.
 */
export const getStageDeleteDisabledState = ({
  allStages,
  currentStage,
  deleteProtection,
  deletePermission,
}: {
  allStages: Stage[];
  currentStage: Stage;
  deleteProtection: { isProtected: boolean; reason: string };
  deletePermission: DefaultPermissionListCheckResult["delete"];
}): { status: boolean; reason: string } => {
  const pipelineStages = allStages.filter((stage) => stage.spec.cdPipeline === currentStage.spec.cdPipeline);

  if (pipelineStages.length <= 1) {
    return { status: true, reason: "Deployment should have at least one Environment" };
  }

  const otherStagesHighestOrder = Math.max(
    ...pipelineStages
      .filter((stage) => stage.metadata.name !== currentStage.metadata.name)
      .map((stage) => stage.spec.order)
  );

  if (currentStage.spec.order <= otherStagesHighestOrder) {
    return { status: true, reason: "You are able to delete only the last Environment" };
  }

  return getDisabledState(deleteProtection, deletePermission);
};
