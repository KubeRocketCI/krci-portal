import { messageClasses, conflictEntityNameClasses } from "./styles";
import { Link } from "@tanstack/react-router";
import { ConflictItemErrorProps } from "./types";
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

export const ConflictItemError = ({ conflictedCDPipeline, name }: ConflictItemErrorProps) => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  return (
    <div className={messageClasses}>
      <span>Branch {name} is used in </span>
      <div className={conflictEntityNameClasses}>
        <Link
          to={routeCDPipelineDetails.fullPath}
          params={{
            clusterName,
            name: conflictedCDPipeline.metadata.name!,
            namespace: conflictedCDPipeline.metadata.namespace!,
          }}
        >
          {conflictedCDPipeline.metadata.name}
        </Link>
      </div>
      <span> Deployment</span>
    </div>
  );
};
