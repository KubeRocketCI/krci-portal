import { ShieldCheck } from "lucide-react";
import { k8sClusterRoleConfig } from "@my-project/shared";
import { clusterRoleColumns } from "./cluster-roles.columns";
import { ClusterRoleOverviewTab } from "../../components/overrides/ClusterRoleOverviewTab";
import type { ResourceDescriptor } from "../types";

export const clusterRolesDescriptor: ResourceDescriptor = {
  config: k8sClusterRoleConfig,
  label: "ClusterRoles",
  sidebarGroup: "Security",
  sidebarIcon: ShieldCheck,
  detailVariant: "cluster",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: clusterRoleColumns,
  status: () => ({ phase: "Active", severity: "success" }),
  overviewTab: ClusterRoleOverviewTab,
};
