import { useStyles } from "./styles";
import { ClusterCDPipelineConflictErrorProps } from "./types";
import { Link } from "@tanstack/react-router";
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

export const ClusterCDPipelineConflictError = ({
  conflictedStage,
  clusterName,
}: ClusterCDPipelineConflictErrorProps) => {
  const classes = useStyles();
  const defaultClusterName = useClusterStore(useShallow((state) => state.clusterName));

  return (
    <div className={classes.message}>
      <span>{clusterName} is used in</span>
      <div className={classes.conflictEntityName}>
        <Link
          to={routeCDPipelineDetails.fullPath}
          params={{
            clusterName: defaultClusterName,
            name: conflictedStage.spec.cdPipeline,
            namespace: conflictedStage.metadata.namespace!,
          }}
        >
          {conflictedStage.spec.cdPipeline}
        </Link>
      </div>
      <span> CD Pipeline</span>
    </div>
  );
};
