import { PipelineRun, PipelineRunStatus, PipelineRunReason } from "../..";

export const getPipelineRunStatus = (
  pipelineRun: PipelineRun | undefined
): {
  status: PipelineRunStatus;
  reason: PipelineRunReason;
  message: string;
  lastTransitionTime: string;
  startTime: string;
  completionTime: string;
} => {
  const firstCondition = pipelineRun?.status?.conditions?.[0];

  const status =
    (firstCondition?.status?.toLowerCase() as PipelineRunStatus) || "Unknown";
  const reason =
    (firstCondition?.reason?.toLowerCase() as PipelineRunReason) || "Unknown";
  const message = firstCondition?.message || "No message";
  const lastTransitionTime = firstCondition?.lastTransitionTime || "N/A";
  const startTime = pipelineRun?.status?.startTime || "N/A";
  const completionTime = pipelineRun?.status?.completionTime || "N/A";

  return {
    status,
    reason,
    message,
    lastTransitionTime,
    startTime,
    completionTime,
  };
};
