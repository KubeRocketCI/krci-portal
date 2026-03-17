import { Stage } from "@my-project/shared";

export interface ClusterCDPipelineConflictErrorProps {
  conflictedStage: Stage;
  clusterName: string | undefined;
}
