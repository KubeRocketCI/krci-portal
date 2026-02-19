import { MatchFunctions } from "@/core/providers/Filter";
import {
  PipelineRun,
  pipelineRunLabels,
  pipelineType,
  getPipelineRunStatus,
  getPipelineRunAnnotation,
  tektonResultAnnotations,
} from "@my-project/shared";
import { PipelineRunListFilterValues } from "./types";

export const pipelineRunFilterControlNames = {
  CODEBASES: "codebases",
  CODEBASE_BRANCHES: "codebaseBranches",
  STATUS: "status",
  PIPELINE_TYPE: "pipelineType",
  NAMESPACES: "namespaces",
} as const;

export const matchFunctions: MatchFunctions<PipelineRun, PipelineRunListFilterValues> = {
  [pipelineRunFilterControlNames.CODEBASES]: (item, value) => {
    if (!value || value.length === 0) return true;

    const pipelineRunType = item?.metadata?.labels?.[pipelineRunLabels.pipelineType];

    if (pipelineRunType === pipelineType.deploy || pipelineRunType === pipelineType.clean) {
      const appPayload = item?.spec?.params?.find(
        (param: { name: string; value?: string }) => param.name === "APPLICATIONS_PAYLOAD"
      );

      if (!appPayload) {
        return false;
      }

      const appPayloadValue = JSON.parse(appPayload.value);

      return Object.keys(appPayloadValue).some((key) => value.includes(key));
    }

    const itemCodebase = item?.metadata?.labels?.[pipelineRunLabels.codebase];

    if (!itemCodebase) {
      return false;
    }

    return value.includes(itemCodebase);
  },
  [pipelineRunFilterControlNames.CODEBASE_BRANCHES]: (item, value) => {
    if (!value || value.length === 0) return true;
    const itemBranch = getPipelineRunAnnotation(item, tektonResultAnnotations.gitBranch);
    if (!itemBranch) return false;
    return value.includes(itemBranch);
  },
  [pipelineRunFilterControlNames.STATUS]: (item, value) => {
    if (value === "all") {
      return true;
    }

    return getPipelineRunStatus(item).status === value;
  },
  [pipelineRunFilterControlNames.PIPELINE_TYPE]: (item, value) => {
    if (value === "all") {
      return true;
    }

    return item?.metadata?.labels?.[pipelineRunLabels.pipelineType] === value;
  },
  [pipelineRunFilterControlNames.NAMESPACES]: (item, value) => {
    const arrayValue = Array.isArray(value) ? value : value ? [value] : [];
    if (arrayValue.length === 0) return true;
    return arrayValue.includes(item.metadata.namespace!);
  },
};
