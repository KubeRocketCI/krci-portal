import { Bell, Folder, Globe, HardDrive, Layers, PanelsTopLeft, Server, Shield } from "lucide-react";
import type { NavItem, SimpleNavItem } from "@/core/components/sidebar/types";
import { resourceRegistry } from "../registry";
import type { SidebarGroup as RegistrySidebarGroup } from "../registry/types";
import { PATH_K8S_OVERVIEW_FULL } from "../pages/overview/route";
import { PATH_K8S_LIST_FULL } from "../pages/list/route";
import { PATH_K8S_EVENTS_FULL } from "../pages/events/route";

const groupIconMap: Record<RegistrySidebarGroup, typeof Layers> = {
  Workloads: Layers,
  Network: Globe,
  Storage: HardDrive,
  Config: Folder,
  Security: Shield,
  Cluster: Server,
};

export function createK8sNavigationConfig(clusterName: string, allowedKinds: Set<string>): NavItem[] {
  const params = { clusterName };
  const items: NavItem[] = [{ title: "Overview", icon: PanelsTopLeft, route: { to: PATH_K8S_OVERVIEW_FULL, params } }];

  const groups: RegistrySidebarGroup[] = ["Workloads", "Network", "Storage", "Config", "Security", "Cluster"];

  for (const group of groups) {
    const groupChildren = Object.entries(resourceRegistry)
      .filter(([key, d]) => d.sidebarGroup === group && !d.sidebarHidden && allowedKinds.has(key))
      .map(([key, d]) => ({
        title: d.label,
        icon: d.sidebarIcon ?? groupIconMap[group] ?? Layers,
        route: (d.listRoute
          ? { to: d.listRoute, params }
          : { to: PATH_K8S_LIST_FULL, params: { ...params, kind: key } }) as unknown as SimpleNavItem["route"],
        isActiveFn: (pathname: string) => new RegExp(`/k8s/(ns/|cluster/)?${key}(/|$)`).test(pathname),
      }));

    if (groupChildren.length > 0) {
      items.push({ title: group, icon: groupIconMap[group] ?? Layers, children: groupChildren });
    }
  }

  items.push({
    title: "Events",
    icon: Bell,
    route: { to: PATH_K8S_EVENTS_FULL, params } as unknown as SimpleNavItem["route"],
  } as SimpleNavItem);

  return items;
}
