import { Layers2 } from "lucide-react";
import { k8sStatefulSetConfig } from "@my-project/shared";
import { statefulSetColumns } from "./statefulsets.columns";
import type { ResourceDescriptor } from "../types";

export const statefulSetsDescriptor: ResourceDescriptor = {
  config: k8sStatefulSetConfig,
  label: "StatefulSets",
  sidebarGroup: "Workloads",
  sidebarIcon: Layers2,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: statefulSetColumns,
  status: (item) => {
    const status = (item as { status?: { readyReplicas?: number; updatedReplicas?: number } }).status;
    const spec = (item as { spec?: { replicas?: number } }).spec;
    const ready = status?.readyReplicas ?? 0;
    const desired = spec?.replicas ?? 0;
    if (desired === 0) return { phase: "Suspended", severity: "neutral" };
    return ready === desired
      ? { phase: "Available", severity: "success" }
      : { phase: "Progressing", severity: "warning" };
  },
};
