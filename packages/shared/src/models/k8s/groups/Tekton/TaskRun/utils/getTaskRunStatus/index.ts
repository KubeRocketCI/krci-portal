import { TaskRun, TaskRunStatus, TaskRunStatusReason } from "../../index.js";
import { taskRunStatus as taskRunStatusValues } from "../../constants.js";

export const getTaskRunStatus = (
  taskRun: TaskRun | undefined
): {
  status: TaskRunStatus | "unknown";
  reason: TaskRunStatusReason | undefined;
} => {
  const condition = taskRun?.status?.conditions?.[0];
  const status = condition?.status?.toLowerCase() || taskRunStatusValues.unknown;
  const reason = condition?.reason?.toLowerCase() as TaskRunStatusReason | undefined;

  return {
    status: status as TaskRunStatus,
    reason,
  };
};
