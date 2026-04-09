import { getIconTypeFromPath } from "@/core/constants/page-icons";
import type { PinnedPage } from "@/core/hooks/usePinnedItems";
import type { RouteParams } from "@/core/router/types";

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
