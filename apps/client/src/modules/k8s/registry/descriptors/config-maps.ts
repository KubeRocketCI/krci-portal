import { Map } from "lucide-react";
import { k8sConfigMapConfig } from "@my-project/shared";
import { configMapColumns } from "./config-maps.columns";
import { ConfigMapOverviewTab } from "../../components/overrides/ConfigMapOverviewTab";
import type { ResourceDescriptor } from "../types";

export const configMapsDescriptor: ResourceDescriptor = {
  config: k8sConfigMapConfig,
  label: "ConfigMaps",
  sidebarGroup: "Config",
  sidebarIcon: Map,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: configMapColumns,
  status: () => ({ phase: "Active", severity: "success" }),
  overviewTab: ConfigMapOverviewTab,
};
