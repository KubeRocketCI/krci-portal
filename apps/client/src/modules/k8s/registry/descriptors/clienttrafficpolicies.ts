import { Globe } from "lucide-react";
import { k8sClientTrafficPolicyConfig } from "@my-project/shared";
import { clientTrafficPolicyColumns } from "../dynamic/firstClass/columns";
import { PolicyOverviewTab } from "../../components/overrides/PolicyOverviewTab";
import type { ResourceDescriptor } from "../types";

export const clientTrafficPoliciesDescriptor: ResourceDescriptor = {
  config: k8sClientTrafficPolicyConfig,
  label: "Client Traffic Policies",
  sidebarGroup: "Network",
  sidebarIcon: Globe,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: clientTrafficPolicyColumns,
  overviewTab: PolicyOverviewTab,
};
