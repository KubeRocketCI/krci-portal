import type { PinTarget } from "@/core/hooks/usePinnedItems";
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
 * Converts a nav item's title and router link props into a pin target.
 * A missing `to` falls back to `/`; missing params fall back to `{}`.
 */
export function createPinTarget(title: string, route: RouteParams): PinTarget {
  return {
    label: title,
    route: {
      to: route.to ?? "/",
      params: (route.params ?? {}) as Record<string, string>,
    },
  };
}
