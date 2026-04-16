import { TaskRun, TaskRunStatus, TaskRunStatusReason } from "../../index.js";
import { taskRunStatus as taskRunStatusValues, taskRunStatusReason as taskRunReasonValues } from "../../constants.js";

export const getTaskRunStatus = (
  taskRun: TaskRun | undefined
): {
  status: TaskRunStatus | "unknown";
  reason: TaskRunStatusReason | "unknown";
} => {
  const status = taskRun?.status?.conditions?.[0]?.status?.toLowerCase() || taskRunStatusValues.unknown;
  const reason = taskRun?.status?.conditions?.[0]?.reason?.toLowerCase() || taskRunReasonValues.running;

  return {
    status: status as TaskRunStatus,
    reason: reason as TaskRunStatusReason,
  };
};
