import { PipelineRun, PipelineRunStatus, PipelineRunReason } from "../..";

export const getPipelineRunStatus = (
  pipelineRun: PipelineRun | undefined
): {
  status: PipelineRunStatus;
  reason: PipelineRunReason;
  message: string;
} => {
  const status = pipelineRun?.status?.conditions?.[0]?.status || "Unknown";
  const reason = pipelineRun?.status?.conditions?.[0]?.reason || "Unknown";
  const message = pipelineRun?.status?.conditions?.[0]?.message || "No message";

  return {
    status,
    reason,
    message,
  };
};
