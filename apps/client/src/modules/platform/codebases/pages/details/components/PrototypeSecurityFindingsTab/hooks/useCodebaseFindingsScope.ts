// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import { applicationLabels } from "@my-project/shared";
import { useCodebaseImageStreamWatchList } from "@/k8s/api/groups/KRCI/CodebaseImageStream";
import { useCodebaseApplicationsWatch, useCodebaseBranchListWatch, useCodebaseStagesWatch } from "../../../hooks/data";
import { routeProjectDetails } from "../../../route";
import type { CodebaseEnvironment, CodebaseFindingsScope } from "../types";

/**
 * Kubernetes side of the joins: branches, image names and Environments of the codebase of the route.
 * An Application without a Stage that matches its `pipeline` and `stage` labels is not an Environment.
 */
export function useCodebaseFindingsScope(): { scope: CodebaseFindingsScope; isLoading: boolean } {
  const params = routeProjectDetails.useParams();

  const branchListWatch = useCodebaseBranchListWatch();
  const imageStreamListWatch = useCodebaseImageStreamWatchList({ namespace: params.namespace });
  const applicationListWatch = useCodebaseApplicationsWatch();
  const stageListWatch = useCodebaseStagesWatch();

  const branchList = branchListWatch.data.array;
  const imageStreamList = imageStreamListWatch.data.array;
  const applicationList = applicationListWatch.data.array;
  const stageList = stageListWatch.data.array;

  const scope = React.useMemo<CodebaseFindingsScope>(() => {
    const ownImageNames = new Set<string>();
    for (const imageStream of imageStreamList) {
      if (imageStream.spec.codebase === params.name) {
        ownImageNames.add(imageStream.spec.imageName);
      }
    }

    const environments: CodebaseEnvironment[] = [];
    for (const application of applicationList) {
      const cdPipeline = application.metadata.labels?.[applicationLabels.pipeline];
      const stageName = application.metadata.labels?.[applicationLabels.stage];
      const stage = stageList.find(
        (candidate) => candidate.spec.cdPipeline === cdPipeline && candidate.spec.name === stageName
      );
      if (!cdPipeline || !stageName || !stage) {
        continue;
      }

      environments.push({
        cdPipeline,
        stage: stageName,
        applicationName: application.metadata.name,
        clusterName: stage.spec.clusterName,
        namespace: stage.spec.namespace,
      });
    }

    return {
      codebaseName: params.name,
      namespace: params.namespace,
      branches: branchList.map((branch) => branch.spec.branchName),
      ownImageNames: [...ownImageNames],
      environments,
    };
  }, [params.name, params.namespace, branchList, imageStreamList, applicationList, stageList]);

  return {
    scope,
    isLoading:
      branchListWatch.isLoading ||
      imageStreamListWatch.isLoading ||
      applicationListWatch.isLoading ||
      stageListWatch.isLoading,
  };
}
