import { FilterProviderProps, MatchFunctions, createSearchMatchFunction } from "@/core/providers/Filter";
import {
  PipelineRun,
  pipelineRunLabels,
  pipelineRunPhase,
  getPipelineRunStatus,
  getPipelineRunAnnotation,
  tektonResultAnnotations,
  isHistoryPipelineRun,
} from "@my-project/shared";
import { isCodebaseInPayloadType } from "@/modules/platform/tekton/utils/celFilters";
import {
  normalizePipelineRunStatusFilterValue,
  resolvePipelineRunStatusFilter,
  type PipelineRunStatusFilterValue,
} from "@/modules/platform/tekton/utils/pipelineRunStatusFilter";
import { PipelineRunListFilterValues } from "./types";

export const pipelineRunFilterControlNames = {
  SEARCH: "search",
  CODEBASES: "codebases",
  CODEBASE_BRANCHES: "codebaseBranches",
  STATUS: "status",
  PIPELINE_TYPE: "pipelineType",
  NAMESPACES: "namespaces",
} as const;

// Sentinel for the inert separator option in the codebase combobox. Stripped
// downstream so a crafted `?codebases=__divider__` URL can't leak into filtering.
export const CODEBASE_DIVIDER_VALUE = "__divider__";

export const defaultPipelineRunFilterValues: PipelineRunListFilterValues = {
  [pipelineRunFilterControlNames.SEARCH]: "",
  [pipelineRunFilterControlNames.CODEBASES]: [],
  [pipelineRunFilterControlNames.CODEBASE_BRANCHES]: [],
  [pipelineRunFilterControlNames.NAMESPACES]: [],
  [pipelineRunFilterControlNames.STATUS]: "all",
  [pipelineRunFilterControlNames.PIPELINE_TYPE]: "all",
};

/**
 * `normalizeUrlValues` for the PipelineRun filter. The `status` key is
 * delegated to `normalizePipelineRunStatusFilterValue`, which is the source
 * of truth for the legacy-value mapping and the valid option list.
 */
export const normalizePipelineRunFilterUrlValues = (
  values: Partial<PipelineRunListFilterValues>
): Partial<PipelineRunListFilterValues> => {
  const rawStatus = values[pipelineRunFilterControlNames.STATUS] as string | undefined;
  if (rawStatus === undefined) {
    return values;
  }

  return {
    ...values,
    [pipelineRunFilterControlNames.STATUS]: normalizePipelineRunStatusFilterValue(rawStatus),
  };
};

export const matchFunctions: MatchFunctions<PipelineRun, PipelineRunListFilterValues> = {
  [pipelineRunFilterControlNames.SEARCH]: createSearchMatchFunction<PipelineRun>(),
  [pipelineRunFilterControlNames.CODEBASES]: (item, value) => {
    const realValues = new Set(value?.filter((v) => v !== CODEBASE_DIVIDER_VALUE));
    if (realValues.size === 0) return true;

    const pipelineRunType = item?.metadata?.labels?.[pipelineRunLabels.pipelineType];
    // Results adapter omits spec.params, so deploy/clean history must fall back to the codebase label.
    if (isCodebaseInPayloadType(pipelineRunType) && !isHistoryPipelineRun(item)) {
      const appPayload = item?.spec?.params?.find(
        (param: { name: string; value?: string }) => param.name === "APPLICATIONS_PAYLOAD"
      );

      if (!appPayload || !appPayload.value) {
        return false;
      }

      let appPayloadValue: Record<string, unknown>;
      try {
        appPayloadValue = JSON.parse(appPayload.value);
      } catch {
        return false;
      }

      return Object.keys(appPayloadValue).some((key) => realValues.has(key));
    }

    const itemCodebase = item?.metadata?.labels?.[pipelineRunLabels.codebase];

    if (!itemCodebase) {
      return false;
    }

    return realValues.has(itemCodebase);
  },
  [pipelineRunFilterControlNames.CODEBASE_BRANCHES]: (item, value) => {
    if (!value || value.length === 0) return true;
    const itemBranch = getPipelineRunAnnotation(item, tektonResultAnnotations.gitBranch);
    if (!itemBranch) return false;
    return value.includes(itemBranch);
  },
  [pipelineRunFilterControlNames.STATUS]: (item, value: PipelineRunStatusFilterValue) => {
    const { livePhases } = resolvePipelineRunStatusFilter(value);
    if (!livePhases) return true;

    // A history record from Tekton Results is archived => terminal; its
    // summary may be an unfinalized "in-progress" but the run itself is
    // never actually running, so exclude it.
    if (livePhases.has(pipelineRunPhase["in-progress"]) && isHistoryPipelineRun(item)) {
      return false;
    }

    return livePhases.has(getPipelineRunStatus(item).phase);
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

/** Shared `FilterProvider` wiring for every PipelineRun list mount. */
export const pipelineRunFilterProviderProps: Omit<
  FilterProviderProps<PipelineRun, PipelineRunListFilterValues>,
  "children"
> = {
  matchFunctions,
  defaultValues: defaultPipelineRunFilterValues,
  syncWithUrl: true,
  normalizeUrlValues: normalizePipelineRunFilterUrlValues,
};
