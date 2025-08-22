import { useFilterContext } from "@/core/providers/Filter/hooks";
import { StageWithApplication } from "@/k8s/api/groups/KRCI/Stage/utils/combineStageWithApplications";
import { CDPipelineDetailsFilterControlNames } from "../constants";

export const usePageFilterContext = () => {
  return useFilterContext<StageWithApplication, CDPipelineDetailsFilterControlNames>();
};
