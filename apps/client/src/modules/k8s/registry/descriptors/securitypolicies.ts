import { ShieldCheck } from "lucide-react";
import { k8sSecurityPolicyConfig } from "@my-project/shared";
import { securityPolicyColumns } from "../dynamic/firstClass/columns";
import { PolicyOverviewTab } from "../../components/overrides/PolicyOverviewTab";
import type { ResourceDescriptor } from "../types";

export const securityPoliciesDescriptor: ResourceDescriptor = {
  config: k8sSecurityPolicyConfig,
  label: "Security Policies",
  sidebarGroup: "Network",
  sidebarIcon: ShieldCheck,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: securityPolicyColumns,
  overviewTab: PolicyOverviewTab,
};
