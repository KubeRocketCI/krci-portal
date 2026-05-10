import { Workflow } from "lucide-react";
import { k8sDaemonSetConfig } from "@my-project/shared";
import { daemonSetColumns } from "./daemonsets.columns";
import type { ResourceDescriptor } from "../types";

export const daemonSetsDescriptor: ResourceDescriptor = {
  config: k8sDaemonSetConfig,
  label: "DaemonSets",
  sidebarGroup: "Workloads",
  sidebarIcon: Workflow,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: daemonSetColumns,
  status: (item) => {
    const status = (item as { status?: { numberReady?: number; desiredNumberScheduled?: number } }).status;
    const ready = status?.numberReady ?? 0;
    const desired = status?.desiredNumberScheduled ?? 0;
    return ready === desired
      ? { phase: "Available", severity: "success" }
      : { phase: "Progressing", severity: "warning" };
  },
};
