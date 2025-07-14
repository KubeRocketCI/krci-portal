import { applicationLabels } from "@my-project/shared";
import { createURLObjectFromURLOrigin } from "../utils";

export const ArgoCDURLService = {
  createPipelineLink: (argoCDURLOrigin: string | undefined, pipelineName: string | undefined) => {
    if (!argoCDURLOrigin || !pipelineName) {
      return undefined;
    }

    const argoCDURLObject = createURLObjectFromURLOrigin(argoCDURLOrigin);
    const argoCDApplicationsURLObject = new URL("/applications", argoCDURLObject);
    argoCDApplicationsURLObject.searchParams.append("labels", `${applicationLabels.pipeline}=${pipelineName}`);

    return argoCDApplicationsURLObject.href;
  },
  createApplicationLink: (
    argoCDURLOrigin: string | undefined,
    pipelineName: string | undefined,
    stageName: string | undefined,
    appName: string | undefined
  ) => {
    if (!argoCDURLOrigin || !pipelineName || !stageName || !appName) {
      return undefined;
    }

    const argoCDURLObject = createURLObjectFromURLOrigin(argoCDURLOrigin);
    const argoCDApplicationsURLObject = new URL("/applications", argoCDURLObject);
    argoCDApplicationsURLObject.searchParams.append(
      "labels",
      `${applicationLabels.pipeline}=${pipelineName},${applicationLabels.stage}=${stageName},${applicationLabels.appName}=${appName}`
    );

    return argoCDApplicationsURLObject.href;
  },
  createStageLink: (
    argoCDURLOrigin: string | undefined,
    pipelineName: string | undefined,
    stageName: string | undefined
  ) => {
    if (!argoCDURLOrigin || !pipelineName || !stageName) {
      return undefined;
    }

    const argoCDURLObject = createURLObjectFromURLOrigin(argoCDURLOrigin);
    const argoCDApplicationsURLObject = new URL("/applications", argoCDURLObject);
    argoCDApplicationsURLObject.searchParams.append(
      "labels",
      `${applicationLabels.pipeline}=${pipelineName},${applicationLabels.stage}=${stageName}`
    );

    return argoCDApplicationsURLObject.href;
  },
};
