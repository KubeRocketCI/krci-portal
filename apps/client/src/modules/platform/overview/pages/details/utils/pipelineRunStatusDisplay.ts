import {
  getPipelineRunStatus,
  isPipelineRunCancelledReason,
  pipelineRunStatus,
  pipelineRunReason,
  type PipelineRun,
} from "@my-project/shared";
import { CheckCircle2, CircleSlash, XCircle, PlayCircle, Clock } from "lucide-react";

export type StatusVariant = "success" | "error" | "info" | "neutral";

export function getStatusDisplay(run: PipelineRun): {
  label: string;
  variant: StatusVariant;
  icon: typeof CheckCircle2;
} {
  const { status, reason } = getPipelineRunStatus(run);
  const s = status.toLowerCase();
  const r = reason?.toLowerCase() ?? "";

  // Must precede the "False" → Failed branch: a cancelled run also reports status "False".
  if (isPipelineRunCancelledReason(reason)) {
    return { label: "Cancelled", variant: "neutral", icon: CircleSlash };
  }
  if (s === pipelineRunStatus.true) {
    return { label: "Succeeded", variant: "success", icon: CheckCircle2 };
  }
  if (s === pipelineRunStatus.false) {
    return { label: "Failed", variant: "error", icon: XCircle };
  }
  if (s === pipelineRunStatus.unknown) {
    if (r === pipelineRunReason.started || r === pipelineRunReason.running) {
      return { label: "Running", variant: "info", icon: PlayCircle };
    }
  }
  return { label: "Pending", variant: "neutral", icon: Clock };
}
