import { getIconTypeFromPath } from "@/core/constants/page-icons";
import { buildPinKey } from "@/core/utils/pinKey";
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
 *
 * The pin key is cluster-agnostic: `clusterName` is excluded from the key so
 * that a page pinned on one cluster remains pinned when switching clusters.
 * All other route params are included, sorted by key name, to disambiguate
 * pages that share the same route template (e.g. generic K8s list pages
 * parameterised by `kind`, or CR list pages parameterised by group/version/plural).
 *
 * Key format:
 *   - No identifying params: `page:<path>`
 *   - With identifying params: `page:<path>?<k1>=<v1>&<k2>=<v2>`
 */
export function createPinConfig(title: string, route: RouteParams): PinnedPage {
  const path = route.to ?? "/";
  const params = (route.params ?? {}) as Record<string, string>;
  const iconType = getIconTypeFromPath(path);

  return {
    key: buildPinKey(path, params),
    label: title,
    type: iconType as PinnedPage["type"],
    iconType,
    route: {
      to: path,
      params,
    },
  };
}
