// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import { applicationLabels } from "@my-project/shared";
import { useApplicationsWatch, useStageWatch } from "../../pages/stage-details/hooks";
import { routeStageDetails } from "../../pages/stage-details/route";
import type { PipelineFindingsScope } from "../types";

/**
 * Kubernetes side of the joins on the Stage details page: the Stage of the route and the
 * Applications labelled with its pipeline and stage. `pipeline` holds that one Environment;
 * `null` until the Stage is loaded.
 */
export function useStageEnvironmentScope(): { pipeline: PipelineFindingsScope | null } {
  const params = routeStageDetails.useParams();

  const stage = useStageWatch().query.data;
  const applicationList = useApplicationsWatch().data.array;

  const pipeline = React.useMemo<PipelineFindingsScope | null>(() => {
    if (!stage) {
      return null;
    }

    return {
      portalClusterName: params.clusterName,
      cdPipeline: params.cdPipeline,
      namespace: params.namespace,
      environments: [
        {
          stage: stage.spec.name,
          clusterName: stage.spec.clusterName,
          namespace: stage.spec.namespace,
          applications: applicationList.flatMap((application) => {
            const codebaseName = application.metadata.labels?.[applicationLabels.appName];
            return codebaseName ? [{ applicationName: application.metadata.name, codebaseName }] : [];
          }),
        },
      ],
    };
  }, [params.clusterName, params.cdPipeline, params.namespace, stage, applicationList]);

  return { pipeline };
}
