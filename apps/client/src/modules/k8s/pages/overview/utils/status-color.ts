import { STATUS_COLOR } from "@/k8s/constants/colors";

export function severityColor(severity?: string): string {
  switch (severity) {
    case "success":
      return STATUS_COLOR.SUCCESS;
    case "warning":
      return STATUS_COLOR.MISSING;
    case "error":
    case "destructive":
      return STATUS_COLOR.ERROR;
    case "info":
      return STATUS_COLOR.IN_PROGRESS;
    case "neutral":
      return STATUS_COLOR.SUSPENDED;
    default:
      return STATUS_COLOR.UNKNOWN;
  }
}

export const POD_PHASE_COLOR: Record<string, string> = {
  Running: STATUS_COLOR.SUCCESS,
  Pending: STATUS_COLOR.IN_PROGRESS,
  Succeeded: STATUS_COLOR.SUSPENDED,
  Failed: STATUS_COLOR.ERROR,
  Unknown: STATUS_COLOR.UNKNOWN,
};
