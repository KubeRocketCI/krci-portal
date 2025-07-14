import { StageWithApplication } from "@/core/k8s/api/groups/KRCI/Stage/utils/combineStageWithApplications";

export interface EnvironmentStageProps {
  stageWithApplications: StageWithApplication;
}
