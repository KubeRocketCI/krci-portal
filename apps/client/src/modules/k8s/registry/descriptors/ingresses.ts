import { Router } from "lucide-react";
import { k8sIngressConfig } from "@my-project/shared";
import { ingressColumns } from "./ingresses.columns";
import { IngressOverviewTab } from "../../components/overrides/IngressOverviewTab";
import type { ResourceDescriptor } from "../types";

export const ingressesDescriptor: ResourceDescriptor = {
  config: k8sIngressConfig,
  label: "Ingresses",
  sidebarGroup: "Network",
  sidebarIcon: Router,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: ingressColumns,
  status: () => ({ phase: "Active", severity: "success" }),
  overviewTab: IngressOverviewTab,
};
