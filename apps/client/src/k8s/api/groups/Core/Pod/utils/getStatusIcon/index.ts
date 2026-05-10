import { CircleCheck, CircleDot, CircleX, LoaderCircle, Pause, ShieldQuestion, TriangleAlert } from "lucide-react";
import type { Pod } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { K8sResourceStatusIcon } from "@/k8s/types";

type ContainerState = NonNullable<NonNullable<Pod["status"]>["containerStatuses"]>[number]["state"];

const ERROR_WAITING_REASONS = new Set([
  "CrashLoopBackOff",
  "ImagePullBackOff",
  "ErrImagePull",
  "CreateContainerConfigError",
  "CreateContainerError",
  "InvalidImageName",
  "RunContainerError",
]);

const findContainerIssue = (statuses: NonNullable<Pod["status"]>["containerStatuses"]): string | undefined => {
  if (!statuses) return undefined;
  for (const cs of statuses) {
    const waiting = (cs.state as ContainerState | undefined)?.waiting;
    if (waiting?.reason && ERROR_WAITING_REASONS.has(waiting.reason)) {
      return waiting.reason;
    }
    const terminated = (cs.state as ContainerState | undefined)?.terminated;
    if (terminated?.reason && terminated.exitCode !== 0 && terminated.reason !== "Completed") {
      return terminated.reason;
    }
  }
  return undefined;
};

export const getPodStatusIcon = (pod: Pod): K8sResourceStatusIcon => {
  const phase = pod.status?.phase;
  const reason = pod.status?.reason;
  const containerIssue = findContainerIssue(pod.status?.containerStatuses);

  if (pod.metadata?.deletionTimestamp) {
    return { component: TriangleAlert, color: STATUS_COLOR.MISSING };
  }

  if (containerIssue) {
    return { component: CircleX, color: STATUS_COLOR.ERROR };
  }

  switch (phase) {
    case "Running":
      return { component: CircleCheck, color: STATUS_COLOR.SUCCESS };
    case "Succeeded":
      return { component: CircleDot, color: STATUS_COLOR.SUCCESS };
    case "Failed":
      return { component: CircleX, color: STATUS_COLOR.ERROR };
    case "Pending":
      return { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true };
    case "Unknown":
      return { component: ShieldQuestion, color: STATUS_COLOR.UNKNOWN };
    default:
      if (reason === "Evicted") {
        return { component: Pause, color: STATUS_COLOR.SUSPENDED };
      }
      return { component: ShieldQuestion, color: STATUS_COLOR.UNKNOWN };
  }
};

export const getPodStatusLabel = (pod: Pod): string => {
  if (pod.metadata?.deletionTimestamp) return "Terminating";
  const containerIssue = findContainerIssue(pod.status?.containerStatuses);
  if (containerIssue) return containerIssue;
  return pod.status?.reason ?? pod.status?.phase ?? "Unknown";
};

export const getPodReadyCounts = (pod: Pod): { ready: number; total: number } => {
  const statuses = pod.status?.containerStatuses ?? [];
  return {
    ready: statuses.filter((c) => c.ready).length,
    total: statuses.length,
  };
};

export const getPodRestartCount = (pod: Pod): number => {
  const statuses = pod.status?.containerStatuses ?? [];
  return statuses.reduce((acc, c) => acc + (c.restartCount ?? 0), 0);
};
