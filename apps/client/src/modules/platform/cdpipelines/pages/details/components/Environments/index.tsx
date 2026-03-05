import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Server } from "lucide-react";
import { EmptyList } from "@/core/components/EmptyList";
import { useStagePermissions } from "@/k8s/api/groups/KRCI/Stage";
import { HorizontalEnvironmentFlow } from "../HorizontalEnvironmentFlow";
import { EnvironmentDetailPanel } from "../EnvironmentDetailPanel";
import { useStageFilter } from "../StageListFilter/hooks/useStageFilter";
import { useCDPipelineWatch, useStageListWatch } from "../../hooks/data";
import { routeCDPipelineDetails } from "../../route";
import { routeStageCreate } from "../../../stages/create/route";

export const Environments = () => {
  const navigate = useNavigate();
  const params = routeCDPipelineDetails.useParams();
  const search = routeCDPipelineDetails.useSearch();
  const { environment: urlSelectedEnvironment } = search;

  const cdPipelineWatch = useCDPipelineWatch();
  const stageListWatch = useStageListWatch();
  const { filterFunction } = useStageFilter();
  const stagePermissions = useStagePermissions();

  // Sort stages by order
  const sortedStages = useMemo(() => {
    return stageListWatch.data.array.toSorted((a, b) => a.spec.order - b.spec.order);
  }, [stageListWatch.data.array]);

  // Apply filter
  const filteredStages = useMemo(() => {
    return sortedStages.filter(filterFunction);
  }, [sortedStages, filterFunction]);

  // Effective selected environment: use URL param or default to first environment
  const selectedEnvironment = useMemo(() => {
    if (urlSelectedEnvironment) {
      return urlSelectedEnvironment;
    }
    // Default to first environment if none specified in URL
    return filteredStages.length > 0 ? filteredStages[0].spec.name : null;
  }, [urlSelectedEnvironment, filteredStages]);

  // Find selected stage
  const selectedStage = filteredStages.find((s) => s.spec.name === selectedEnvironment);

  const isLoading = cdPipelineWatch.isLoading || stageListWatch.isLoading;

  if (isLoading) {
    return null;
  }

  if (sortedStages.length === 0) {
    if (!stagePermissions.data.create.allowed) {
      return (
        <EmptyList
          missingItemName="Environments"
          icon={<Server size={128} />}
          beforeLinkText={stagePermissions.data.create.reason}
        />
      );
    }

    return (
      <EmptyList
        missingItemName="Environments"
        icon={<Server size={128} />}
        linkText={"by adding a new one here."}
        beforeLinkText="Take the first step towards managing your Environment"
        handleClick={() => {
          navigate({
            to: routeStageCreate.fullPath,
            params: { clusterName: params.clusterName, namespace: params.namespace, cdPipeline: params.name },
          });
        }}
      />
    );
  }

  if (filteredStages.length === 0) {
    return (
      <EmptyList
        missingItemName="Environments"
        icon={<Server size={128} />}
        linkText={undefined}
        beforeLinkText="No environments match your current filters. Try adjusting your search criteria."
        handleClick={undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <HorizontalEnvironmentFlow stages={filteredStages} selectedEnvironment={selectedEnvironment || null} />

      {selectedStage && <EnvironmentDetailPanel stage={selectedStage} />}
    </div>
  );
};
