import { pipelineRunFilterControlNames } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";

export const PIPELINERUN_LIST_TABLE_ID = "pipelineruns-unified";
export const PIPELINERUN_LIST_TABLE_NAME = "Unified Pipeline Run List";

/** Search param marking the active saved view. */
export const PIPELINERUN_VIEW_SEARCH_PARAM = "view";

export const PIPELINERUN_VIEW_ID_PREFIX = "v_";
export const PIPELINERUN_VIEWS_MAX_PER_CLUSTER = 50;
export const PIPELINERUN_VIEW_NAME_MAX_LENGTH = 64;

/** Filter controls shown on the page. A saved view stores and applies exactly these. */
export const PIPELINERUN_LIST_FILTER_CONTROLS = [
  pipelineRunFilterControlNames.SEARCH,
  pipelineRunFilterControlNames.CODEBASES,
  pipelineRunFilterControlNames.STATUS,
  pipelineRunFilterControlNames.PIPELINE_TYPE,
  pipelineRunFilterControlNames.NAMESPACES,
] as const;

export const PIPELINERUN_VIEW_ERROR_MESSAGES = {
  limit: `You can save up to ${PIPELINERUN_VIEWS_MAX_PER_CLUSTER} views per cluster.`,
  "duplicate-name": "A view with this name already exists.",
  "invalid-name": `Enter a name of 1–${PIPELINERUN_VIEW_NAME_MAX_LENGTH} characters.`,
  "not-found": "This view no longer exists.",
  storage: "The browser could not save the view. Free up site storage and try again.",
  "unsupported-version": "Saved views were stored by a newer portal version and cannot be changed here.",
} as const;
