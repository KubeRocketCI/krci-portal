import { ClassifiableRun, TaskRunPhase, TaskRunStatusResult } from "../../types.js";
import { isTaskRunCancelledReason, taskRunPhase } from "../../constants.js";
import { isHistoryRecord } from "../../../../../../tektonResults/annotations.js";

/**
 * Phase from the `Succeeded` condition. Status decides; reason only splits False into
 * cancelled and failed. No condition on a live run: in-progress. No run: unknown.
 * Archived record (historySource annotation) with Unknown or no condition: unknown.
 */
export const getTaskRunStatus = (run: ClassifiableRun | undefined): TaskRunStatusResult => {
  const condition = run?.status?.conditions?.find((c) => c.type === "Succeeded");
  // An empty reason is absent, not a reason. Keeps the label from rendering "".
  const reason = condition?.reason?.toLowerCase() || undefined;
  const isHistory = isHistoryRecord(run);

  let phase: TaskRunPhase;

  if (run === undefined) {
    phase = taskRunPhase.unknown;
  } else if (condition === undefined) {
    phase = isHistory ? taskRunPhase.unknown : taskRunPhase["in-progress"];
  } else {
    const status = condition.status?.toLowerCase();

    if (status === "true") {
      phase = taskRunPhase.succeeded;
    } else if (status === "false") {
      phase = isTaskRunCancelledReason(reason) ? taskRunPhase.cancelled : taskRunPhase.failed;
    } else {
      phase = isHistory ? taskRunPhase.unknown : taskRunPhase["in-progress"];
    }
  }

  return {
    phase,
    reason,
    message: condition?.message,
    lastTransitionTime: condition?.lastTransitionTime,
    startTime: run?.status?.startTime,
    completionTime: run?.status?.completionTime,
  };
};
