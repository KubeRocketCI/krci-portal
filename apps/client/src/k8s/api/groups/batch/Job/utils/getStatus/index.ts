import { CircleCheck, CircleDot, CircleX, LoaderCircle, TriangleAlert } from "lucide-react";
import type { Job } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { K8sResourceStatusIcon } from "@/k8s/types";

interface JobStatusView {
  failed: boolean;
  complete: boolean;
  active: boolean;
  terminating: boolean;
}

const readStatus = (job: Job): JobStatusView => {
  const spec = job.spec as { completions?: number } | undefined;
  const status = job.status;
  const conditions = status?.conditions as Array<{ type?: string; status?: string }> | undefined;
  const failed = !!conditions?.find((c) => c.type === "Failed" && c.status === "True");
  const completeCondition = !!conditions?.find((c) => c.type === "Complete" && c.status === "True");
  const completions = spec?.completions ?? 0;
  const succeeded = status?.succeeded ?? 0;
  return {
    failed,
    complete: completeCondition || (completions > 0 && succeeded >= completions),
    active: (status?.active ?? 0) > 0,
    terminating: !!job.metadata?.deletionTimestamp,
  };
};

export const getJobStatusIcon = (job: Job): K8sResourceStatusIcon => {
  const s = readStatus(job);
  if (s.terminating) return { component: TriangleAlert, color: STATUS_COLOR.MISSING };
  if (s.failed) return { component: CircleX, color: STATUS_COLOR.ERROR };
  if (s.complete) return { component: CircleCheck, color: STATUS_COLOR.SUCCESS };
  if (s.active) return { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true };
  return { component: CircleDot, color: STATUS_COLOR.UNKNOWN };
};

export const getJobStatusLabel = (job: Job): string => {
  const s = readStatus(job);
  if (s.terminating) return "Terminating";
  if (s.failed) return "Failed";
  if (s.complete) return "Complete";
  if (s.active) return "Running";
  return "Pending";
};
