import { Waypoints } from "lucide-react";
import { k8sHTTPRouteConfig } from "@my-project/shared";
import { httpRouteColumns } from "../dynamic/firstClass/columns";
import { HTTPRouteOverviewTab } from "../../components/overrides/HTTPRouteOverviewTab";
import type { ResourceDescriptor } from "../types";

export const httpRoutesDescriptor: ResourceDescriptor = {
  config: k8sHTTPRouteConfig,
  label: "HTTP Routes",
  sidebarGroup: "Network",
  sidebarIcon: Waypoints,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: httpRouteColumns,
  overviewTab: HTTPRouteOverviewTab,
};
