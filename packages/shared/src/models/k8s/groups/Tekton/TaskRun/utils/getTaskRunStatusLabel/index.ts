import { TaskRunPhase, TaskRunStatusResult } from "../../types.js";
import { taskRunPhase, taskRunStatusReason } from "../../constants.js";
import { capitalizeFirstLetter } from "../../../../../../../utils/capitalizeFirstLetter.js";

/** Display as "Running". */
const runningReasons: readonly string[] = [taskRunStatusReason.started, taskRunStatusReason.running];

/** Reasons whose capitalized raw value reads poorly. Others capitalize. */
const reasonLabels: Record<string, string> = {
  [taskRunStatusReason.taskrunpending]: "Pending",
  [taskRunStatusReason.pending]: "Pending",
  [taskRunStatusReason.toberetried]: "Retrying",
  [taskRunStatusReason.resolvingtaskref]: "Resolving",
  [taskRunStatusReason.resolvingstepactionref]: "Resolving",
  [taskRunStatusReason.pullimagefailed]: "Pulling image",
  [taskRunStatusReason.exceedednoderesources]: "Waiting for resources",
  [taskRunStatusReason.exceededresourcequota]: "Waiting for resources",
  [taskRunStatusReason.taskruntimeout]: "Timeout",
  [taskRunStatusReason.customruntimedout]: "Timeout",
  [taskRunStatusReason.taskrunimagepullfailed]: "Image pull failed",
  [taskRunStatusReason.failureignored]: "Failed (ignored)",
  [taskRunStatusReason.taskrunvalidationfailed]: "Validation failed",
  [taskRunStatusReason.taskvalidationfailed]: "Validation failed",
  [taskRunStatusReason.taskrunresolutionfailed]: "Resolution failed",
  [taskRunStatusReason.taskrunresultlargerthanallowedlimit]: "Result too large",
  [taskRunStatusReason.stepoom]: "Out of memory",
  [taskRunStatusReason.sidecaroom]: "Out of memory",
  [taskRunStatusReason.initcontaineroom]: "Out of memory",
  [taskRunStatusReason.podevicted]: "Pod evicted",
};

const toLabel = (reason: string): string => reasonLabels[reason] ?? capitalizeFirstLetter(reason);

/** Display word for a run. In-progress with no reason reads "Running". Do not re-case the result. */
export const getTaskRunStatusLabel = (status: Pick<TaskRunStatusResult, "phase" | "reason">): string => {
  const { phase, reason } = status;

  switch (phase) {
    case taskRunPhase["in-progress"]:
      return reason === undefined || runningReasons.includes(reason) ? "Running" : toLabel(reason);
    case taskRunPhase.cancelled:
      return "Cancelled";
    case taskRunPhase.succeeded:
      return reason === undefined ? "Succeeded" : toLabel(reason);
    case taskRunPhase.failed:
      return reason === undefined ? "Failed" : toLabel(reason);
    case taskRunPhase.unknown:
      return "Unknown";
    default: {
      const _exhaustiveCheck: never = phase;
      throw new Error(`Unhandled TaskRun phase: ${_exhaustiveCheck as TaskRunPhase}`);
    }
  }
};
