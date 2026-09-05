import { PipelineRun } from "../../types.js";
import { pipelineRunPhase } from "../../constants.js";
import { getPipelineRunStatus } from "../getPipelineRunStatus/index.js";

/**
 * True when the run's phase is `in-progress`.
 * Phase is status-authoritative; see getPipelineRunStatus for the full rule.
 */
export const isPipelineRunInProgress = (pipelineRun: PipelineRun | undefined): boolean =>
  getPipelineRunStatus(pipelineRun).phase === pipelineRunPhase["in-progress"];
