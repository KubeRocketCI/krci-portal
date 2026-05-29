import type { ResourceDescriptor, ResourceRegistry } from "./types";

// Extracts the first path segment after `/k8s/` from a descriptor's listRoute,
// e.g. "/c/$clusterName/k8s/crds" → "crds".
export function listRouteSlug(listRoute: string | undefined): string | null {
  if (!listRoute) return null;
  const m = listRoute.match(/\/k8s\/([^/]+)/);
  return m ? m[1] : null;
}

export function resolveDescriptor(registry: ResourceRegistry, kind: string): ResourceDescriptor | null {
  if (registry[kind]) return registry[kind];
  // Fallback: a descriptor may declare a listRoute whose URL slug differs from
  // its registry key (e.g. key "customresourcedefinitions" vs slug "crds").
  for (const d of Object.values(registry)) {
    if (listRouteSlug(d.listRoute) === kind) return d;
  }
  return null;
}
