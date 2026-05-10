import { Users } from "lucide-react";
import { k8sRoleBindingConfig } from "@my-project/shared";
import { roleBindingColumns } from "./role-bindings.columns";
import type { ResourceDescriptor } from "../types";

export const roleBindingsDescriptor: ResourceDescriptor = {
  config: k8sRoleBindingConfig,
  label: "RoleBindings",
  sidebarGroup: "Security",
  sidebarIcon: Users,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: roleBindingColumns,
  status: () => ({ phase: "Active", severity: "success" }),
};
