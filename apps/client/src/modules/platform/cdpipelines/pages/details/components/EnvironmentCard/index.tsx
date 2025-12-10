import { Card } from "@/core/components/ui/card";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { routeCDPipelineDetails } from "../../route";
import { EnvironmentCardProps } from "./types";
import { Header, HealthSummary, ExternalServices, InfoGrid, ApplicationsList, CardActions } from "./components";

export const EnvironmentCard = ({ stage, isExpanded, onToggleExpand }: EnvironmentCardProps) => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const params = routeCDPipelineDetails.useParams();

  const linkParams = {
    clusterName,
    cdPipeline: params.name,
    namespace: params.namespace,
    stage: stage.spec.name,
  };

  return (
    <Card>
      {/* Header - only stage data, no hooks */}
      <Header stage={stage} isExpanded={isExpanded} onToggleExpand={onToggleExpand} linkParams={linkParams} />

      {/* Collapsed View - HealthSummary fetches its own Argo apps */}
      {!isExpanded && (
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <HealthSummary stage={stage} />
            <CardActions linkParams={linkParams} />
          </div>
        </div>
      )}

      {/* Expanded View - each section fetches its own data */}
      {isExpanded && (
        <div className="space-y-6 px-6 py-4">
          {/* ExternalServices - fetches quickLinks */}
          <ExternalServices stage={stage} />

          {/* InfoGrid - only stage data */}
          <InfoGrid stage={stage} />

          {/* ApplicationsList - fetches Argo apps, codebases, quickLinks */}
          <ApplicationsList stage={stage} />

          {/* Actions */}
          <div className="flex items-center border-t pt-3">
            <CardActions linkParams={linkParams} />
          </div>
        </div>
      )}
    </Card>
  );
};
