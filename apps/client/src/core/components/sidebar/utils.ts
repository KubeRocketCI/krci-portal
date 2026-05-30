import { getIconTypeFromPath } from "@/core/constants/page-icons";
import type { PinnedPage } from "@/core/hooks/usePinnedItems";
import type { RouteParams } from "@/core/router/types";
import type { NavGroupItem } from "./types";

/**
 * Returns true when `pathname` activates any child of a nav group — a simple
 * item's `isActiveFn`, a collapsible-subgroup child, or a sub-group child.
 * Shared by useSidebarMenu (auto-open state) and SidebarMenuItemWithHover
 * (active highlight) so the two stay in sync.
 */
export function isNavGroupActiveForPathname(item: NavGroupItem, pathname: string): boolean {
  return item.children.some((child) => {
    if ("isActiveFn" in child && child.isActiveFn) return child.isActiveFn(pathname);
    if ("kind" in child && child.kind === "collapsible-subgroup") {
      return child.children.some((c) => c.isActiveFn?.(pathname));
    }
    if ("children" in child) return (child.children ?? []).some((c) => c.isActiveFn?.(pathname));
    return false;
  });
}

/**
 * Helper to create a pin config from route and title.
 * Derives the icon type from the route path.
 */
export function createPinConfig(title: string, route: RouteParams): PinnedPage {
  const path = route.to ?? "/";
  const params = route.params ?? {};
  const iconType = getIconTypeFromPath(path);

  return {
    key: `page:${path}`,
    label: title,
    type: iconType as PinnedPage["type"],
    iconType,
    route: {
      to: path,
      params: params as Record<string, string>,
    },
  };
}
