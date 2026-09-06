import { TaskRunStepState, taskRunStepStatusReason } from "@my-project/shared";

export const approvalTaskBackground =
  "repeating-linear-gradient(45deg, rgba(96, 96, 96, 0.15), rgba(96, 96, 96, 0.15) 10px, rgba(70, 70, 70, 0.15) 10px, rgba(70, 70, 70, 0.15) 20px)";

export function updateUnexecutedSteps(steps: TaskRunStepState[] | undefined) {
  if (!steps) {
    return [];
  }

  let errorIndex = steps.length - 1;
  return steps.map((step, index) => {
    if (!step.terminated || step.terminated.reason !== taskRunStepStatusReason.Completed) {
      errorIndex = Math.min(index, errorIndex);
    }
    if (index > errorIndex) {
      delete step.running;
      delete step.terminated;
      return step;
    }
    return step;
  });
}
