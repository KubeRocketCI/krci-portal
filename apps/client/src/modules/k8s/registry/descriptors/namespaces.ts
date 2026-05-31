import { Boxes } from "lucide-react";
import { k8sNamespaceConfig } from "@my-project/shared";
import { namespaceColumns } from "./namespaces.columns";
import { NamespaceOverviewTab } from "../../components/overrides/NamespaceOverviewTab";
import type { ResourceDescriptor } from "../types";

export const namespacesDescriptor: ResourceDescriptor = {
  config: k8sNamespaceConfig,
  label: "Namespaces",
  sidebarGroup: "Cluster",
  sidebarIcon: Boxes,
  detailVariant: "cluster",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: namespaceColumns,
  overviewTab: NamespaceOverviewTab,
  status: (item) => {
    const phase = (item as { status?: { phase?: string } }).status?.phase ?? "";
    if (phase === "Active") return { phase: "Active", severity: "success" };
    if (phase === "Terminating") return { phase: "Terminating", severity: "warning" };
    return { phase: phase || "Unknown", severity: "neutral" };
  },
};
