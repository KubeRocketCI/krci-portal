import { Bot, Boxes, Package, PanelsTopLeft } from "lucide-react";
import type { NavItem } from "@/core/components/sidebar/types";
import {
  PATH_FACTORY_ACTORS_FULL,
  PATH_FACTORY_AGENTS_FULL,
  PATH_FACTORY_OVERVIEW_FULL,
  PATH_FACTORY_WORKER_POOLS_FULL,
} from "./paths";

export function createFactoryNavigationConfig(clusterName: string): NavItem[] {
  const params = { clusterName };

  return [
    { title: "Overview", icon: PanelsTopLeft, route: { to: PATH_FACTORY_OVERVIEW_FULL, params } },
    { title: "Agents", icon: Bot, route: { to: PATH_FACTORY_AGENTS_FULL, params } },
    { title: "Actors", icon: Package, route: { to: PATH_FACTORY_ACTORS_FULL, params } },
    { title: "Worker pools", icon: Boxes, route: { to: PATH_FACTORY_WORKER_POOLS_FULL, params } },
  ];
}
