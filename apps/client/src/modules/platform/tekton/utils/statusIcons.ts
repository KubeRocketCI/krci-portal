import { STATUS_COLOR } from "@/k8s/constants/colors";
import { TektonResultStatus, DecodedPipelineRunCondition } from "@my-project/shared";
import { CircleCheck, CircleX, Clock, Loader2, ShieldQuestion, LucideIcon } from "lucide-react";

export interface StatusIconConfig {
  Icon: LucideIcon;
  color: string;
  title: string;
  isSpinning?: boolean;
}

/**
 * Status icon configuration map for Tekton Result status
 * Used in list/table views showing historical pipeline run results
 */
const TEKTON_RESULT_STATUS_ICON_MAP: Record<TektonResultStatus, StatusIconConfig> = {
  SUCCESS: {
    Icon: CircleCheck,
    color: STATUS_COLOR.SUCCESS,
    title: "Success",
    isSpinning: false,
  },
  FAILURE: {
    Icon: CircleX,
    color: STATUS_COLOR.ERROR,
    title: "Failure",
    isSpinning: false,
  },
  TIMEOUT: {
    // TIMEOUT is specific to Tekton Results API - using Clock icon with MISSING color (orange)
    Icon: Clock,
    color: STATUS_COLOR.MISSING,
    title: "Timeout",
    isSpinning: false,
  },
  CANCELLED: {
    Icon: CircleX,
    color: STATUS_COLOR.SUSPENDED,
    title: "Cancelled",
    isSpinning: false,
  },
  UNKNOWN: {
    Icon: ShieldQuestion,
    color: STATUS_COLOR.UNKNOWN,
    title: "Unknown",
    isSpinning: false,
  },
} as const;

/**
 * Get status icon configuration for Tekton Result status
 * Used in list/table views showing historical pipeline run results
 */
export const getTektonResultStatusIcon = (status: TektonResultStatus | undefined): StatusIconConfig => {
  return TEKTON_RESULT_STATUS_ICON_MAP[status ?? "UNKNOWN"];
};

/**
 * Get status icon configuration based on decoded PipelineRun condition
 * Used in detail views showing full pipeline run status from Tekton Results
 */
export const getPipelineRunConditionStatusIcon = (condition?: DecodedPipelineRunCondition): StatusIconConfig => {
  if (!condition) {
    return { Icon: ShieldQuestion, color: STATUS_COLOR.UNKNOWN, title: "Unknown", isSpinning: false };
  }

  const { status, reason } = condition;

  if (status === "True") {
    return { Icon: CircleCheck, color: STATUS_COLOR.SUCCESS, title: "Succeeded", isSpinning: false };
  }

  if (status === "False") {
    if (reason === "Failed" || reason === "CouldntGetPipeline") {
      return { Icon: CircleX, color: STATUS_COLOR.ERROR, title: reason || "Failed", isSpinning: false };
    }
    if (reason === "Cancelled" || reason === "StoppedRunFinally") {
      return { Icon: CircleX, color: STATUS_COLOR.SUSPENDED, title: reason || "Cancelled", isSpinning: false };
    }
    if (reason === "PipelineRunTimeout") {
      return { Icon: Clock, color: STATUS_COLOR.MISSING, title: "Timeout", isSpinning: false };
    }
    return { Icon: CircleX, color: STATUS_COLOR.ERROR, title: reason || "Failed", isSpinning: false };
  }

  // status === "Unknown" - Running
  if (reason === "Running" || reason === "Started") {
    return { Icon: Loader2, color: STATUS_COLOR.IN_PROGRESS, title: "Running", isSpinning: true };
  }

  return { Icon: ShieldQuestion, color: STATUS_COLOR.UNKNOWN, title: reason || "Unknown", isSpinning: false };
};
