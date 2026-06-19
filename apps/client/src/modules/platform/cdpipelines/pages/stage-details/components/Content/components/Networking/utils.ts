// URL derivation for HTTPRoutes — covers the common host+path cases; advanced filter
// rewrites (e.g. RequestRedirect) are intentionally not modeled here.

import type { DerivedURL, NetGateway, NetHTTPRoute, NetRouteFilter, NetRoutingRule } from "./types";

/**
 * Aggregate route filters across all rules of a route, deduplicated by
 * `${type}::${summary}`, preserving first-seen order.
 * Shared between RouteCard and DetailDrawer to avoid diverging logic.
 */
export function aggregateFilters(rules: NetRoutingRule[]): NetRouteFilter[] {
  const allFilters: NetRouteFilter[] = [];
  const seen = new Set<string>();
  for (const rule of rules) {
    for (const f of rule.filters ?? []) {
      const key = `${f.type}::${f.summary}`;
      if (!seen.has(key)) {
        seen.add(key);
        allFilters.push(f);
      }
    }
  }
  return allFilters;
}

function isWildcard(h: string): boolean {
  return h.includes("*");
}

/**
 * Derive clickable URLs from a single HTTPRoute + its parent gateways.
 * Draft quality: covers the common case, ignores RequestRedirect filters.
 */
export function deriveHTTPRouteURLs(route: NetHTTPRoute, gateways: NetGateway[]): DerivedURL[] {
  const results: DerivedURL[] = [];

  const routeLive = route.parentConditions.some(
    (pc) =>
      pc.conditions.some((c) => c.type === "Accepted" && c.status === "True") &&
      pc.conditions.some((c) => c.type === "ResolvedRefs" && c.status === "True")
  );

  for (const parentRef of route.parentRefs) {
    const gateway = gateways.find((g) => g.name === parentRef.name);
    if (!gateway) continue;

    const gwAccepted = gateway.conditions.some((c) => c.type === "Accepted" && c.status === "True");
    const gwProgrammed = gateway.conditions.find((c) => c.type === "Programmed");
    const gwUsable = gwAccepted && (gwProgrammed?.status === "True" || gwProgrammed?.reason === "AddressNotAssigned");
    if (!gwUsable) continue;

    let listeners = gateway.listeners;
    if (parentRef.sectionName) {
      listeners = listeners.filter((l) => l.name === parentRef.sectionName);
    }

    for (const listener of listeners) {
      if (listener.protocol !== "HTTP" && listener.protocol !== "HTTPS") continue;

      const scheme = listener.protocol === "HTTPS" ? "https" : "http";
      const standardPort = (scheme === "https" && listener.port === 443) || (scheme === "http" && listener.port === 80);
      const portSuffix = standardPort ? "" : `:${listener.port}`;

      const candidateHostnames = (route.hostnames ?? []).filter((h) => !isWildcard(h));
      const effectiveHostnames =
        candidateHostnames.length > 0
          ? candidateHostnames
          : listener.hostname && !isWildcard(listener.hostname)
            ? [listener.hostname]
            : [];

      for (const hostname of effectiveHostnames) {
        const firstRule = route.rules[0];
        const pathValue =
          firstRule?.pathType === "PathPrefix" || firstRule?.pathType === "Exact" ? (firstRule.pathValue ?? "/") : "/";

        const url = `${scheme}://${hostname}${portSuffix}${pathValue}`;
        results.push({ url, healthy: routeLive });
      }
    }
  }

  const seen = new Set<string>();
  return results.filter(({ url }) => (seen.has(url) ? false : (seen.add(url), true)));
}

/** Returns "green" | "amber" | "red" for a condition value */
export function conditionColor(status: "True" | "False" | "Unknown", reason?: string): "green" | "amber" | "red" {
  if (status === "True") return "green";
  if (status === "Unknown") return "amber";
  // False + AddressNotAssigned is amber (expected in kind clusters)
  if (reason === "AddressNotAssigned") return "amber";
  return "red";
}
