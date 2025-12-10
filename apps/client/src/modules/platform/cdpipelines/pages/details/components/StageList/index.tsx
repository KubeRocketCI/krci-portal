import { EmptyList } from "@/core/components/EmptyList";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { ManageStageDialog } from "@/modules/platform/cdpipelines/dialogs/ManageStage";
import { Server } from "lucide-react";
import React from "react";
import { useCDPipelineWatch, useStageListWatch } from "../../hooks/data";
import { EnvironmentCard } from "../EnvironmentCard";
import { EnvironmentFlowArrow } from "../EnvironmentFlowArrow";
import { useStageFilter } from "../StageListFilter/hooks/useStageFilter";

export const StageList = () => {
  const cdPipelineWatch = useCDPipelineWatch();
  const stageListWatch = useStageListWatch();
  const { filterFunction } = useStageFilter();

  const [expandedEnvs, setExpandedEnvs] = React.useState<Set<string>>(new Set());

  const openManageStageDialog = useDialogOpener(ManageStageDialog);

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
    return (
      <EmptyList
        missingItemName="Environments"
        icon={<Server size={128} />}
        linkText={"by adding a new one here."}
        beforeLinkText="Take the first step towards managing your Environment"
        handleClick={() => {
          openManageStageDialog({
            cdPipeline: cdPipelineWatch.data!,
            otherStages: sortedStages,
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
