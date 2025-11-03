import { taskRunStepStatusFieldName } from "../../constants";
import { TaskRunStepReason, TaskRunStepState, TaskRunStepStatus } from "../../types";

type StepWithReasonFieldName = typeof taskRunStepStatusFieldName.terminated | typeof taskRunStepStatusFieldName.waiting;

type StepWithReason = TaskRunStepState & {
  [key in StepWithReasonFieldName]: {
    reason: TaskRunStepReason;
  };
};

export const getTaskRunStepStatus = (
  step: TaskRunStepState | undefined
): {
  statusObject: TaskRunStepState["terminated"] | TaskRunStepState["waiting"];
  status: TaskRunStepStatus | "Unknown";
  reason: TaskRunStepReason | "Unknown";
  startedAt: string;
  finishedAt: string;
} => {
  const statusObject = step?.[taskRunStepStatusFieldName.running]
    ? undefined
    : step?.[taskRunStepStatusFieldName.waiting] || step?.[taskRunStepStatusFieldName.terminated];

  const status = step?.[taskRunStepStatusFieldName.running]
    ? taskRunStepStatusFieldName.running
    : step?.[taskRunStepStatusFieldName.waiting]
      ? taskRunStepStatusFieldName.waiting
      : step?.[taskRunStepStatusFieldName.terminated]
        ? taskRunStepStatusFieldName.terminated
        : "Unknown";

  return {
    statusObject,
    status,
    reason: statusObject?.reason || "Unknown",
    startedAt: step?.terminated?.startedAt || step?.running?.startedAt || "",
    finishedAt: step?.terminated?.finishedAt || "",
  };
};
