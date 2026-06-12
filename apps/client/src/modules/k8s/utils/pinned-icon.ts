import { Bell, PanelsTopLeft, Puzzle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PinnedPage } from "@/core/hooks/usePinnedItems";
import { resourceRegistry } from "../registry";
import { resolveDescriptor } from "../registry/resolve";
import { groupIconMap } from "../constants/nav";

/**
 * Resolves the icon for a pinned K8s-mode page at render time.
 *
 * K8s list pages mostly share one generic route template (`/k8s/$kind`), so the
 * static PATH_TO_ICON_TYPE map used for KRCI pins cannot distinguish them — the
 * identity lives in route params, not the path. This resolver derives the kind
 * from the stored route (the `kind` param for the generic template, the path
 * slug for dedicated routes like `/k8s/pods`) and reuses the same registry
 * icons the K8s sidebar renders, so pinned entries match their nav items.
 *
 * Returns undefined for non-K8s routes and unknown kinds so the caller can fall
 * through to the static PAGE_ICONS registry / generic Box fallback.
 */
export function getK8sPinnedPageIcon(page: Pick<PinnedPage, "route">): LucideIcon | undefined {
  // Anchored to the K8s route prefix so a `/k8s/` segment elsewhere in a
  // non-K8s path can never trigger registry resolution.
  const slugMatch = page.route.to.match(/^\/c\/\$clusterName\/k8s\/([^/]+)/);
  if (!slugMatch) return undefined;
  const slug = slugMatch[1];

  if (slug === "overview") return PanelsTopLeft;
  if (slug === "events") return Bell;
  // Generic custom-resource routes (`/k8s/cr/$group/$version/$plural`).
  if (slug === "cr") return Puzzle;

  const kind = slug === "$kind" ? page.route.params.kind : slug;
  if (!kind) return undefined;

  const descriptor = resolveDescriptor(resourceRegistry, kind);
  if (!descriptor) return undefined;
  return descriptor.sidebarIcon ?? groupIconMap[descriptor.sidebarGroup];
}
