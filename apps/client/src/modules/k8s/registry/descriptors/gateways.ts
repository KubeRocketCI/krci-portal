import { DoorOpen } from "lucide-react";
import { k8sGatewayConfig } from "@my-project/shared";
import { gatewayColumns } from "../dynamic/firstClass/columns";
import { GatewayOverviewTab } from "../../components/overrides/GatewayOverviewTab";
import type { ResourceDescriptor } from "../types";

export const gatewaysDescriptor: ResourceDescriptor = {
  config: k8sGatewayConfig,
  label: "Gateways",
  sidebarGroup: "Network",
  sidebarIcon: DoorOpen,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: gatewayColumns,
  overviewTab: GatewayOverviewTab,
};
