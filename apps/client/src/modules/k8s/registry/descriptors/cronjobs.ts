import { Clock } from "lucide-react";
import { k8sCronJobConfig } from "@my-project/shared";
import { cronJobColumns } from "./cronjobs.columns";
import type { ResourceDescriptor } from "../types";

export const cronJobsDescriptor: ResourceDescriptor = {
  config: k8sCronJobConfig,
  label: "CronJobs",
  sidebarGroup: "Workloads",
  sidebarIcon: Clock,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: cronJobColumns,
  status: (item) => {
    const spec = (item as { spec?: { suspend?: boolean } }).spec;
    return spec?.suspend ? { phase: "Suspended", severity: "neutral" } : { phase: "Active", severity: "success" };
  },
};
