import { Bell, Folder, Globe, HardDrive, Layers, PanelsTopLeft, Puzzle, Server, Shield } from "lucide-react";
import type { NavCollapsibleSubGroupItem, NavItem, SimpleNavItem } from "@/core/components/sidebar/types";
import { resourceRegistry } from "../registry";
import { listRouteSlug } from "../registry/resolve";
import type { SidebarGroup as RegistrySidebarGroup } from "../registry/types";
import { PATH_K8S_CRDS_FULL, PATH_K8S_EVENTS_FULL, PATH_K8S_LIST_FULL, PATH_K8S_OVERVIEW_FULL } from "./paths";

const groupIconMap: Record<RegistrySidebarGroup, typeof Layers> = {
  Workloads: Layers,
  Network: Globe,
  Storage: HardDrive,
  Config: Folder,
  Security: Shield,
  Cluster: Server,
  CustomResources: Puzzle,
};

export function createK8sNavigationConfig(
  clusterName: string,
  crSidebarItems: NavCollapsibleSubGroupItem[] = []
): NavItem[] {
  const params = { clusterName };
  const items: NavItem[] = [{ title: "Overview", icon: PanelsTopLeft, route: { to: PATH_K8S_OVERVIEW_FULL, params } }];

  const groups: RegistrySidebarGroup[] = [
    "Workloads",
    "Network",
    "Storage",
    "Config",
    "Security",
    "Cluster",
    "CustomResources",
  ];

  for (const group of groups) {
    const groupChildren = Object.entries(resourceRegistry)
      .filter(([, d]) => d.sidebarGroup === group && !d.sidebarHidden)
      .map(([key, d]) => {
        const slug = listRouteSlug(d.listRoute) ?? key;
        // Compile once per item (this factory runs inside a useMemo), not on every
        // isActiveFn call — the sidebar tests isActiveFn on each navigation event.
        const activeRe = new RegExp(`/k8s/(ns/|cluster/)?${slug}(/|$)`);
        return {
          title: d.label,
          icon: d.sidebarIcon ?? groupIconMap[group] ?? Layers,
          route: (d.listRoute
            ? { to: d.listRoute, params }
            : { to: PATH_K8S_LIST_FULL, params: { ...params, kind: key } }) as unknown as SimpleNavItem["route"],
          isActiveFn: (pathname: string) => activeRe.test(pathname),
        };
      });

    if (group === "CustomResources") {
      // The "CRDs" descriptor is sidebarHidden so the parent header doesn't visually
      // duplicate it; the group itself links to the CRDs list page via `defaultRoute`.
      const mergedChildren = [...groupChildren, ...crSidebarItems];
      if (mergedChildren.length > 0) {
        items.push({
          title: "Custom Resources",
          icon: groupIconMap.CustomResources ?? Layers,
          defaultRoute: { to: PATH_K8S_CRDS_FULL, params } as unknown as SimpleNavItem["route"],
          children: mergedChildren,
        });
      }
    } else if (groupChildren.length > 0) {
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
