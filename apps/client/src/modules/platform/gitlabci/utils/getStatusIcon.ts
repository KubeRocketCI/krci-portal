import { STATUS_COLOR } from "@/k8s/constants/colors";
import { Ban, CircleCheck, CirclePause, CircleX, Clock, LoaderCircle, ShieldQuestion, SkipForward } from "lucide-react";
import type { K8sResourceStatusIcon } from "@/k8s/types";

export interface GitLabCIStatusIcon extends K8sResourceStatusIcon {
  title: string;
}

const titleCase = (status: string): string => status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Non-terminal statuses — the single source of truth for "is this still active" (e.g. polling).
const ACTIVE_STATUSES = new Set(["running", "pending", "created", "preparing", "scheduled", "waiting_for_resource"]);

export function isGitLabCIPipelineActive(status: string | undefined): boolean {
  return ACTIVE_STATUSES.has((status ?? "").toLowerCase());
}

export function getGitLabCIPipelineStatusIcon(status: string | undefined): GitLabCIStatusIcon {
  const normalized = (status ?? "").toLowerCase();

  switch (normalized) {
    case "success":
      return { component: CircleCheck, color: STATUS_COLOR.SUCCESS, title: "Success" };
    case "failed":
      return { component: CircleX, color: STATUS_COLOR.ERROR, title: "Failed" };
    case "running":
      return { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true, title: "Running" };
    case "pending":
    case "created":
    case "preparing":
    case "scheduled":
    case "waiting_for_resource":
      return { component: Clock, color: STATUS_COLOR.IN_PROGRESS, title: titleCase(normalized) };
    case "canceled":
    case "cancelled":
      return { component: Ban, color: STATUS_COLOR.SUSPENDED, title: "Canceled" };
    case "skipped":
      return { component: SkipForward, color: STATUS_COLOR.SUSPENDED, title: "Skipped" };
    case "manual":
      return { component: CirclePause, color: STATUS_COLOR.MISSING, title: "Manual" };
    default:
      return {
        component: ShieldQuestion,
        color: STATUS_COLOR.UNKNOWN,
        title: status ? titleCase(normalized) : "Unknown",
      };
  }
}
