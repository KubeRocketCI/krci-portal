import { Gauge } from "lucide-react";
import { k8sHorizontalPodAutoscalerConfig } from "@my-project/shared";
import { horizontalPodAutoscalerColumns } from "./horizontal-pod-autoscalers.columns";
import type { ResourceDescriptor } from "../types";

export const horizontalPodAutoscalersDescriptor: ResourceDescriptor = {
  config: k8sHorizontalPodAutoscalerConfig,
  label: "HorizontalPodAutoscalers",
  sidebarGroup: "Config",
  sidebarIcon: Gauge,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: horizontalPodAutoscalerColumns,
  status: () => ({ phase: "Active", severity: "success" }),
};
