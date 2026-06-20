import { ArrowRightLeft } from "lucide-react";
import { k8sBackendTrafficPolicyConfig } from "@my-project/shared";
import { backendTrafficPolicyColumns } from "../dynamic/firstClass/columns";
import { PolicyOverviewTab } from "../../components/overrides/PolicyOverviewTab";
import type { ResourceDescriptor } from "../types";

export const backendTrafficPoliciesDescriptor: ResourceDescriptor = {
  config: k8sBackendTrafficPolicyConfig,
  label: "Backend Traffic Policies",
  sidebarGroup: "Network",
  sidebarIcon: ArrowRightLeft,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: backendTrafficPolicyColumns,
  overviewTab: PolicyOverviewTab,
};
