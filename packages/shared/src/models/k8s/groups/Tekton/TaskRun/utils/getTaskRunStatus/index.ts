import { taskRunStepStatusFieldName } from "../../constants";
import { TaskRunStepReason, TaskRunStepState } from "../../types";

export const getTaskRunStepStatus = (step: TaskRunStepState | undefined) => {
  return (
    step?.[taskRunStepStatusFieldName.running] ||
    step?.[taskRunStepStatusFieldName.waiting] ||
    step?.[taskRunStepStatusFieldName.terminated]
  );
};

type StepWithReasonFieldName =
  | typeof taskRunStepStatusFieldName.terminated
  | typeof taskRunStepStatusFieldName.waiting;

type StepWithReason = TaskRunStepState & {
  [key in StepWithReasonFieldName]: {
    reason: TaskRunStepReason;
  };
};

export const getTaskRunStepReason = (
  step: StepWithReason | undefined
): TaskRunStepReason | undefined => {
  if (step?.[taskRunStepStatusFieldName.running]) {
    return undefined;
  }

  return (
    step?.[taskRunStepStatusFieldName.waiting]?.reason ??
    step?.[taskRunStepStatusFieldName.terminated]?.reason
  );
};
