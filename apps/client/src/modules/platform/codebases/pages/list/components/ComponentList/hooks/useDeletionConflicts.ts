import React from "react";
import { useCDPipelineWatchList } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useStageWatchList } from "@/k8s/api/groups/KRCI/Stage";
import { codebaseType, type Codebase } from "@my-project/shared";
import type { ComponentsToDelete, ComponentsToDeleteConflicts } from "../types";

export const useDeletionConflicts = (
  selectedComponents: string[],
  componentsByNameMap: Map<string, Codebase> | null
): {
  componentsToDelete: ComponentsToDelete | null;
  componentsToDeleteConflicts: ComponentsToDeleteConflicts | null;
  isLoading: boolean;
} => {
  const cdPipelineListWatch = useCDPipelineWatchList();
  const stageListWatch = useStageWatchList();

  const isLoading = cdPipelineListWatch.query.isLoading || stageListWatch.query.isLoading;

  return React.useMemo(() => {
    if (isLoading || componentsByNameMap === null) {
      return {
        componentsToDelete: null,
        componentsToDeleteConflicts: null,
        isLoading,
      };
    }

    const componentsWithConflicts: ComponentsToDeleteConflicts = new Map();
    const componentsCanBeDeleted: ComponentsToDelete = new Map();

    const cdPipelines = cdPipelineListWatch.data.array;
    const stages = stageListWatch.data.array;

    for (const componentName of selectedComponents) {
      const componentObject = componentsByNameMap.get(componentName);

      if (!componentObject) {
        continue;
      }

      const componentTypeValue = componentObject.spec?.type;

      if (componentTypeValue === codebaseType.system) {
        continue;
      }

      if (componentTypeValue !== codebaseType.application && componentTypeValue !== codebaseType.autotest) {
        componentsCanBeDeleted.set(componentName, componentObject);
        continue;
      }

      const pipelineConflicts = cdPipelines.filter((pipeline) => pipeline.spec.applications.includes(componentName));

      const stageConflicts = stages.filter((stage) =>
        stage.spec.qualityGates?.some((qualityGate) => qualityGate.autotestName === componentName)
      );

      if (pipelineConflicts.length > 0 || stageConflicts.length > 0) {
        componentsWithConflicts.set(componentName, {
          component: componentObject,
          pipelines: pipelineConflicts,
          stages: stageConflicts,
        });
      } else {
        componentsCanBeDeleted.set(componentName, componentObject);
      }
    }

    return {
      componentsToDelete: componentsCanBeDeleted,
      componentsToDeleteConflicts: componentsWithConflicts,
      isLoading: false,
    };
  }, [isLoading, componentsByNameMap, cdPipelineListWatch.data.array, stageListWatch.data.array, selectedComponents]);
};
