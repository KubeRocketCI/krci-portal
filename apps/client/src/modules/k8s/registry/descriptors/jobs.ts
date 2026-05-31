import { Play } from "lucide-react";
import { k8sJobConfig } from "@my-project/shared";
import { jobColumns } from "./jobs.columns";
import { JobOverviewTab } from "../../components/overrides/JobOverviewTab";
import type { ResourceDescriptor } from "../types";

export const jobsDescriptor: ResourceDescriptor = {
  config: k8sJobConfig,
  label: "Jobs",
  sidebarGroup: "Workloads",
  sidebarIcon: Play,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: jobColumns,
  status: (item) => {
    const status = (item as { status?: { succeeded?: number; failed?: number }; spec?: { completions?: number } })
      .status;
    const spec = (item as { spec?: { completions?: number } }).spec;
    const failed = status?.failed ?? 0;
    const succeeded = status?.succeeded ?? 0;
    const completions = spec?.completions ?? 1;
    if (failed > 0) return { phase: "Failed", severity: "error" };
    if (succeeded >= completions) return { phase: "Complete", severity: "success" };
    return { phase: "Running", severity: "info" };
  },
  overviewTab: JobOverviewTab,
};
