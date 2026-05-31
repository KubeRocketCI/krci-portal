import { CircleCheck, Clock, LoaderCircle, Pause, TriangleAlert } from "lucide-react";
import type { CronJob } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { K8sResourceStatusIcon } from "@/k8s/types";

interface CronJobStatusView {
  terminating: boolean;
  suspended: boolean;
  active: number;
  hasLastSchedule: boolean;
}

const readStatus = (cronJob: CronJob): CronJobStatusView => {
  const spec = cronJob.spec as { suspend?: boolean } | undefined;
  const status = cronJob.status as { active?: unknown[]; lastScheduleTime?: string } | undefined;
  return {
    terminating: !!cronJob.metadata?.deletionTimestamp,
    suspended: spec?.suspend === true,
    active: status?.active?.length ?? 0,
    hasLastSchedule: !!status?.lastScheduleTime,
  };
};

export const getCronJobStatusIcon = (cronJob: CronJob): K8sResourceStatusIcon => {
  const s = readStatus(cronJob);
  if (s.terminating) return { component: TriangleAlert, color: STATUS_COLOR.MISSING };
  if (s.suspended) return { component: Pause, color: STATUS_COLOR.SUSPENDED };
  if (s.active > 0) return { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true };
  if (s.hasLastSchedule) return { component: CircleCheck, color: STATUS_COLOR.SUCCESS };
  return { component: Clock, color: STATUS_COLOR.UNKNOWN };
};

export const getCronJobStatusLabel = (cronJob: CronJob): string => {
  const s = readStatus(cronJob);
  if (s.terminating) return "Terminating";
  if (s.suspended) return "Suspended";
  if (s.active > 0) return "Active";
  if (s.hasLastSchedule) return "Scheduled";
  return "Pending";
};
