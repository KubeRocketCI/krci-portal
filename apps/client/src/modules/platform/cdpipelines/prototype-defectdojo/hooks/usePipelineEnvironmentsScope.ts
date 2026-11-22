// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import { useClusterStore } from "@/k8s/store";
import { useSortedStages } from "../../pages/details/hooks/usePipelineData";
import { routeCDPipelineDetails } from "../../pages/details/route";
import type { PipelineFindingsScope } from "../types";

/**
 * Kubernetes side of the joins on the CDPipeline details page: every Stage of the pipeline of the
 * route, by `spec.order`. Applications are not read: the cards show namespace counts only.
 */
export function usePipelineEnvironmentsScope(): PipelineFindingsScope {
  const params = routeCDPipelineDetails.useParams();
  const portalClusterName = useClusterStore((state) => state.clusterName);
  const { data: stages } = useSortedStages();

  return React.useMemo<PipelineFindingsScope>(
    () => ({
      portalClusterName,
      cdPipeline: params.name,
      namespace: params.namespace,
      environments: stages.map((stage) => ({
        stage: stage.spec.name,
        clusterName: stage.spec.clusterName,
        namespace: stage.spec.namespace,
        applications: [],
      })),
    }),
    [portalClusterName, params.name, params.namespace, stages]
  );
}
