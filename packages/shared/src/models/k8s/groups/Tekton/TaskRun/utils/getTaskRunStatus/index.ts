import { TaskRun, TaskRunStatus, TaskRunStatusReason } from "../..";

export const getTaskRunStatus = (
  taskRun: TaskRun | undefined
): {
  status: TaskRunStatus | "unknown";
  reason: TaskRunStatusReason | "unknown";
} => {
  const status = taskRun?.status?.conditions?.[0]?.status?.toLowerCase() || "unknown";
  const reason = taskRun?.status?.conditions?.[0]?.reason?.toLowerCase() || "unknown";

  return {
    status: status as TaskRunStatus,
    reason: reason as TaskRunStatusReason,
  };
};
