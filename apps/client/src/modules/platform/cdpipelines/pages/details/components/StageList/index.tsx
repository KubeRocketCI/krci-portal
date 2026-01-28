import { EmptyList } from "@/core/components/EmptyList";
import { useStagePermissions } from "@/k8s/api/groups/KRCI/Stage";
import { Server } from "lucide-react";
import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { routeCDPipelineDetails } from "../../route";
import { routeStageCreate } from "../../../stages/create/route";
import { useCDPipelineWatch, useStageListWatch } from "../../hooks/data";
import { EnvironmentCard } from "../EnvironmentCard";
import { EnvironmentFlowArrow } from "../EnvironmentFlowArrow";
import { useStageFilter } from "../StageListFilter/hooks/useStageFilter";

export const StageList = () => {
  const cdPipelineWatch = useCDPipelineWatch();
  const stageListWatch = useStageListWatch();
  const { filterFunction } = useStageFilter();
  const stagePermissions = useStagePermissions();

  const navigate = useNavigate();
  const { clusterName, namespace, name } = routeCDPipelineDetails.useParams();

  const [expandedEnvs, setExpandedEnvs] = React.useState<Set<string>>(new Set());

  const toggleEnvExpanded = React.useCallback((envId: string) => {
    setExpandedEnvs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(envId)) {
        newSet.delete(envId);
      } else {
        newSet.add(envId);
      }
      return newSet;
    });
  }, []);

  // Sort stages by order
  const sortedStages = React.useMemo(() => {
    return stageListWatch.data.array.toSorted((a, b) => a.spec.order - b.spec.order);
  }, [stageListWatch.data.array]);

  // Apply filter
  const filteredStages = React.useMemo(() => {
    return sortedStages.filter(filterFunction);
  }, [sortedStages, filterFunction]);

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
            params: { clusterName, namespace, cdPipeline: name },
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
    <div className="space-y-0">
      {filteredStages.map((stage, index) => {
        const envId = stage.metadata.name;
        const isExpanded = expandedEnvs.has(envId);
        const isLast = index === filteredStages.length - 1;

        return (
          <div key={envId}>
            <EnvironmentCard stage={stage} isExpanded={isExpanded} onToggleExpand={() => toggleEnvExpanded(envId)} />
            {!isLast && <EnvironmentFlowArrow triggerType={stage.spec.triggerType} />}
          </div>
        );
      })}
    </div>
  );
};
