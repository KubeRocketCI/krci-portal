import { Shield } from "lucide-react";
import { k8sRoleConfig } from "@my-project/shared";
import { roleColumns } from "./roles.columns";
import { RoleOverviewTab } from "../../components/overrides/RoleOverviewTab";
import type { ResourceDescriptor } from "../types";

export const rolesDescriptor: ResourceDescriptor = {
  config: k8sRoleConfig,
  label: "Roles",
  sidebarGroup: "Security",
  sidebarIcon: Shield,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: roleColumns,
  status: () => ({ phase: "Active", severity: "success" }),
  overviewTab: RoleOverviewTab,
};
