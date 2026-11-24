import type { RuntimeContainer } from "@my-project/shared";

/** The Environment the page was opened for: `spec.cdPipeline` and `spec.name` of a Stage. */
export interface SecurityFindingsFocus {
  cdPipeline: string;
  stage: string;
}

/** A container with an open test: it has a version, a date and the counts of its reports. */
export type RunningContainer = Extract<RuntimeContainer, { state: "running" }>;
