import { CircleCheck, CircleX, LoaderCircle, Pause, TriangleAlert } from "lucide-react";
import type { Deployment } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import type { K8sResourceStatusIcon } from "@/k8s/types";

interface DeploymentStatusView {
  desired: number;
  ready: number;
  updated: number;
  available: number;
  replicaFailure: boolean;
  terminating: boolean;
}

const readStatus = (deployment: Deployment): DeploymentStatusView => {
  const spec = deployment.spec;
  const status = deployment.status;
  const conditions = status?.conditions as Array<{ type?: string; status?: string }> | undefined;
  return {
    desired: spec?.replicas ?? 0,
    ready: status?.readyReplicas ?? 0,
    updated: status?.updatedReplicas ?? 0,
    available: status?.availableReplicas ?? 0,
    replicaFailure: !!conditions?.find((c) => c.type === "ReplicaFailure" && c.status === "True"),
    terminating: !!deployment.metadata?.deletionTimestamp,
  };
};

export const getDeploymentStatusIcon = (deployment: Deployment): K8sResourceStatusIcon => {
  const s = readStatus(deployment);
  if (s.terminating) return { component: TriangleAlert, color: STATUS_COLOR.MISSING };
  if (s.replicaFailure) return { component: CircleX, color: STATUS_COLOR.ERROR };
  if (s.desired === 0) return { component: Pause, color: STATUS_COLOR.SUSPENDED };
  if (s.ready === s.desired && s.updated === s.desired && s.available === s.desired) {
    return { component: CircleCheck, color: STATUS_COLOR.SUCCESS };
  }
  return { component: LoaderCircle, color: STATUS_COLOR.IN_PROGRESS, isSpinning: true };
};

export const getDeploymentStatusLabel = (deployment: Deployment): string => {
  const s = readStatus(deployment);
  if (s.terminating) return "Terminating";
  if (s.replicaFailure) return "ReplicaFailure";
  if (s.desired === 0) return "Scaled Down";
  if (s.ready === s.desired && s.updated === s.desired && s.available === s.desired) return "Available";
  return "Progressing";
};
