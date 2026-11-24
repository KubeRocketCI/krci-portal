import { Boxes, Package, PanelsTopLeft, Server } from "lucide-react";
import type { NavItem } from "@/core/components/sidebar/types";
import {
  PATH_AGENT_ACTORS_FULL,
  PATH_AGENT_OVERVIEW_FULL,
  PATH_AGENT_WORKER_POOLS_FULL,
  PATH_AGENT_WORKERS_FULL,
} from "./paths";

export function createAgentNavigationConfig(clusterName: string): NavItem[] {
  const params = { clusterName };

  return [
    { title: "Overview", icon: PanelsTopLeft, route: { to: PATH_AGENT_OVERVIEW_FULL, params } },
    { title: "Actors", icon: Package, route: { to: PATH_AGENT_ACTORS_FULL, params } },
    { title: "Workers", icon: Server, route: { to: PATH_AGENT_WORKERS_FULL, params } },
    { title: "Worker pools", icon: Boxes, route: { to: PATH_AGENT_WORKER_POOLS_FULL, params } },
  ];
}
