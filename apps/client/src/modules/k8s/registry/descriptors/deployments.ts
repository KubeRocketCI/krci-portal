import { Rocket } from "lucide-react";
import { k8sDeploymentConfig } from "@my-project/shared";
import { deploymentColumns } from "./deployments.columns";
import type { ResourceDescriptor } from "../types";

export const deploymentsDescriptor: ResourceDescriptor = {
  config: k8sDeploymentConfig,
  label: "Deployments",
  sidebarGroup: "Workloads",
  sidebarIcon: Rocket,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: deploymentColumns,
  status: (item) => {
    const status = (item as { status?: { readyReplicas?: number } }).status;
    const spec = (item as { spec?: { replicas?: number } }).spec;
    const ready = status?.readyReplicas ?? 0;
    const desired = spec?.replicas ?? 0;
    if (desired === 0) return { phase: "Suspended", severity: "neutral" };
    return ready === desired
      ? { phase: "Available", severity: "success" }
      : { phase: "Progressing", severity: "warning" };
  },
};
