import { Network } from "lucide-react";
import { k8sServiceConfig } from "@my-project/shared";
import { serviceColumns } from "./services.columns";
import type { ResourceDescriptor } from "../types";

export const servicesDescriptor: ResourceDescriptor = {
  config: k8sServiceConfig,
  label: "Services",
  sidebarGroup: "Network",
  sidebarIcon: Network,
  detailVariant: "namespaced",
  defaultSort: { sortBy: "name", order: "asc" },
  columns: serviceColumns,
  status: () => ({ phase: "Active", severity: "success" }),
};
