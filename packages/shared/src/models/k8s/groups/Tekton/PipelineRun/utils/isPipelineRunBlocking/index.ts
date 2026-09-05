import { PipelineRun } from "../../types.js";
import { pipelineRunPhase } from "../../constants.js";
import { getPipelineRunStatus } from "../getPipelineRunStatus/index.js";

/**
 * True when the run's phase should block starting a new deploy or build:
 * still going (`in-progress`), or winding down a graceful cancel (`cancelling`).
 */
export const isPipelineRunBlocking = (pipelineRun: PipelineRun | undefined): boolean => {
  const { phase } = getPipelineRunStatus(pipelineRun);
  return phase === pipelineRunPhase["in-progress"] || phase === pipelineRunPhase.cancelling;
};
