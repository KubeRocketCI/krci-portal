import { TektonResultStatus } from "@my-project/shared";
import { TektonResultsFilterValues } from "./types";

/** Column identifiers for TektonResults table */
export const columnNames = {
  STATUS: "status",
  NAME: "name",
  PIPELINE: "pipeline",
  CODEBASE: "codebase",
  GIT_BRANCH: "gitBranch",
  GIT_CHANGE_NUMBER: "gitChangeNumber",
  AUTHOR: "author",
  PIPELINE_TYPE: "pipelineType",
  CREATED: "created",
  ENDED: "ended",
} as const;

/** Status filter options */
export const tektonResultStatusOptions: { label: string; value: TektonResultStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Success", value: "SUCCESS" },
  { label: "Failure", value: "FAILURE" },
  { label: "Unknown", value: "UNKNOWN" },
  { label: "Timeout", value: "TIMEOUT" },
  { label: "Cancelled", value: "CANCELLED" },
];

/** Pipeline type filter options */
export const tektonResultsPipelineTypeOptions = [
  { label: "All", value: "all" },
  { label: "Build", value: "build" },
  { label: "Review", value: "review" },
  { label: "Deploy", value: "deploy" },
  { label: "Clean", value: "clean" },
  { label: "Release", value: "release" },
];

/** Default filter values */
export const defaultFilterValues: TektonResultsFilterValues = {
  status: "all",
  pipelineType: "all",
  codebases: [],
};
