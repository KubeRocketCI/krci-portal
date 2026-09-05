import { PipelineRunPhase, PipelineRunStatusResult } from "../../types.js";
import { getPipelineRunReasonLabel, pipelineRunPhase, pipelineRunReason } from "../../constants.js";
import { capitalizeFirstLetter } from "../../../../../../../utils/capitalizeFirstLetter.js";

/** In-progress reasons "started" and "running", and no reason at all, display as "Running". */
const runningReasons: readonly string[] = [pipelineRunReason.started, pipelineRunReason.running];

/**
 * Human-friendly, fully-cased status text for a PipelineRun. Combines `phase`
 * and `reason`; an in-progress run with no reason reads "Running", not
 * "Unknown". Callers must not apply their own casing to the result.
 */
export const getPipelineRunStatusLabel = (status: Pick<PipelineRunStatusResult, "phase" | "reason">): string => {
  const { phase, reason } = status;

  switch (phase) {
    case pipelineRunPhase["in-progress"]:
      return reason === undefined || runningReasons.includes(reason)
        ? "Running"
        : capitalizeFirstLetter(getPipelineRunReasonLabel(reason));
    case pipelineRunPhase.cancelling:
      return "Cancelling";
    case pipelineRunPhase.cancelled:
      return "Cancelled";
    case pipelineRunPhase.succeeded:
    case pipelineRunPhase.failed:
      return capitalizeFirstLetter(getPipelineRunReasonLabel(reason));
    case pipelineRunPhase.unknown:
      return "Unknown";
    default: {
      const _exhaustiveCheck: never = phase;
      throw new Error(`Unhandled PipelineRun phase: ${_exhaustiveCheck as PipelineRunPhase}`);
    }
  }
};
