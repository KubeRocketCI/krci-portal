import { pipelineRunLabels, pipelineType } from "@my-project/shared";
import { MatchFunctions } from "./types";

export const pipelineRunFilterControlNames = {
  CODEBASES: "codebases",
  STATUS: "status",
  PIPELINE_TYPE: "pipelineType",
} as const;

export const columnNames = {
  STATUS: "status",
  RUN: "run",
  PIPELINE: "pipeline",
  RESULTS: "results",
  PULL_REQUEST: "pullRequestUrl",
  STARTED_AT: "startedAt",
  TIME: "time",
  DIAGRAM: "diagram",
  ACTIONS: "actions",
} as const;

export const matchFunctions: MatchFunctions = {
  [pipelineRunFilterControlNames.CODEBASES]: (item, value) => {
    if (!value || value.length === 0) return true;

    const pipelineRunType = item?.metadata.labels?.[pipelineRunLabels.pipelineType];

    if (pipelineRunType === pipelineType.deploy || pipelineRunType === pipelineType.clean) {
      const appPayload = item?.spec?.params?.find((param) => param.name === "APPLICATIONS_PAYLOAD");

      if (!appPayload) {
        return false;
      }

      const appPayloadValue = JSON.parse(appPayload.value);

      return Object.keys(appPayloadValue).some((key) => value.includes(key));
    }

    const itemCodebase = item?.metadata.labels?.[pipelineRunLabels.codebase];

    if (!itemCodebase) {
      return false;
    }

    return value.includes(itemCodebase);
  },
  [pipelineRunFilterControlNames.STATUS]: (item, value) => {
    if (value === "All") {
      return true;
    }

    return item?.status?.conditions?.[0]?.status?.toLowerCase() === value;
  },
  [pipelineRunFilterControlNames.PIPELINE_TYPE]: (item, value) => {
    if (value === "all") {
      return true;
    }

    return item?.metadata.labels?.[pipelineRunLabels.pipelineType] === value;
  },
};
