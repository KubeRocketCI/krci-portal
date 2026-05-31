import { Key } from "lucide-react";
import { k8sClusterRoleBindingConfig } from "@my-project/shared";
import { clusterRoleBindingColumns } from "./cluster-role-bindings.columns";
import { ClusterRoleBindingOverviewTab } from "../../components/overrides/ClusterRoleBindingOverviewTab";
import type { ResourceDescriptor } from "../types";

export const clusterRoleBindingsDescriptor: ResourceDescriptor = {
  config: k8sClusterRoleBindingConfig,
  label: "ClusterRoleBindings",
  sidebarGroup: "Security",
  sidebarIcon: Key,
  detailVariant: "cluster",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: clusterRoleBindingColumns,
  status: () => ({ phase: "Active", severity: "success" }),
  overviewTab: ClusterRoleBindingOverviewTab,
};
