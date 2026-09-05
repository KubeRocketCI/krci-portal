import {
  getPipelineRunStatus,
  getPipelineRunStatusLabel,
  pipelineRunPhase,
  type PipelineRun,
} from "@my-project/shared";
import { CheckCircle2, CircleSlash, XCircle, PlayCircle, HelpCircle } from "lucide-react";

export type StatusVariant = "success" | "error" | "info" | "neutral";

export function getStatusDisplay(run: PipelineRun): {
  label: string;
  variant: StatusVariant;
  icon: typeof CheckCircle2;
} {
  const { phase, reason } = getPipelineRunStatus(run);
  const label = getPipelineRunStatusLabel({ phase, reason });

  switch (phase) {
    case pipelineRunPhase["in-progress"]:
      return { label, variant: "info", icon: PlayCircle };
    case pipelineRunPhase.cancelling:
      return { label, variant: "neutral", icon: CircleSlash };
    case pipelineRunPhase.cancelled:
      return { label, variant: "neutral", icon: CircleSlash };
    case pipelineRunPhase.succeeded:
      return { label, variant: "success", icon: CheckCircle2 };
    case pipelineRunPhase.failed:
      return { label, variant: "error", icon: XCircle };
    case pipelineRunPhase.unknown:
      return { label, variant: "neutral", icon: HelpCircle };
    default: {
      const _exhaustiveCheck: never = phase;
      throw new Error(`Unhandled PipelineRun phase: ${_exhaustiveCheck}`);
    }
  }
}
