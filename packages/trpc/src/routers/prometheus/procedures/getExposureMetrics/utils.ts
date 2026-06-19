export interface ParsedEnvoyCluster {
  routeNamespace: string;
  routeName: string;
  ruleIndex: number;
  isMirror: boolean;
}

const HTTPROUTE_RE = /^httproute\/([^/]+)\/([^/]+)\/rule\/(\d+)(?:-mirror-(\d+))?$/;

/**
 * Parse an Envoy cluster name of the form:
 *   httproute/<namespace>/<routeName>/rule/<ruleIdx>
 *   httproute/<namespace>/<routeName>/rule/<ruleIdx>-mirror-<N>
 *
 * Returns null for gateway-level clusters ("<ns>/<gw>"), junk, empty string, etc.
 * Never throws.
 */
export function parseEnvoyClusterName(name: string): ParsedEnvoyCluster | null {
  if (!name || typeof name !== "string") return null;
  const m = HTTPROUTE_RE.exec(name);
  if (!m) return null;
  return {
    routeNamespace: m[1]!,
    routeName: m[2]!,
    ruleIndex: Number(m[3]),
    isMirror: m[4] !== undefined,
  };
}

export interface ExposureBackend {
  key: string;
  routeNamespace: string;
  routeName: string;
  rps: number;
  successPct: number;
}

interface VectorSeries {
  metric: Record<string, string>;
  value: [number, string];
}

interface AggregateExposureArgs {
  rps: VectorSeries[];
  success: VectorSeries[];
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Aggregate Envoy cluster-level Prometheus instant-query results into
 * ExposureBackend entries at TWO granularities:
 *
 *   route-level  key = "<routeNamespace>/<routeName>"
 *                → sum of all rules; used by gw→route edges.
 *
 *   per-rule     key = "<routeNamespace>/<routeName>/<ruleIndex>"
 *                → individual rule total; used by route→backend edges so that
 *                  multi-rule routes show each backend's own rps instead of the
 *                  inflated full-route total.
 *
 * Both granularities are emitted in the same output array; callers distinguish
 * them by key format (slash count: 1 vs 2 extra segments).
 *
 * - Mirror backends (envoy_cluster_name contains "-mirror-") are excluded from rps.
 * - Non-numeric or NaN values are treated as 0.
 * - Empty input arrays → empty output (never throws).
 */
export function aggregateExposure({ rps, success }: AggregateExposureArgs): ExposureBackend[] {
  // Map<key, { routeNamespace, routeName, totalRps, successRps }>
  const byKey = new Map<string, { routeNamespace: string; routeName: string; totalRps: number; successRps: number }>();

  function bucket(key: string, ns: string, route: string) {
    let b = byKey.get(key);
    if (!b) {
      b = { routeNamespace: ns, routeName: route, totalRps: 0, successRps: 0 };
      byKey.set(key, b);
    }
    return b;
  }

  for (const series of rps) {
    const clusterName = series.metric["envoy_cluster_name"] ?? "";
    const parsed = parseEnvoyClusterName(clusterName);
    if (!parsed || parsed.isMirror) continue;
    const routeKey = `${parsed.routeNamespace}/${parsed.routeName}`;
    const ruleKey = `${parsed.routeNamespace}/${parsed.routeName}/${parsed.ruleIndex}`;
    const val = Number.isFinite(Number(series.value[1])) ? Number(series.value[1]) : 0;
    bucket(routeKey, parsed.routeNamespace, parsed.routeName).totalRps += val;
    bucket(ruleKey, parsed.routeNamespace, parsed.routeName).totalRps += val;
  }

  for (const series of success) {
    const clusterName = series.metric["envoy_cluster_name"] ?? "";
    const parsed = parseEnvoyClusterName(clusterName);
    if (!parsed || parsed.isMirror) continue;
    const routeKey = `${parsed.routeNamespace}/${parsed.routeName}`;
    const ruleKey = `${parsed.routeNamespace}/${parsed.routeName}/${parsed.ruleIndex}`;
    const val = Number.isFinite(Number(series.value[1])) ? Number(series.value[1]) : 0;
    // Ensure buckets exist (might not have been seen in rps)
    bucket(routeKey, parsed.routeNamespace, parsed.routeName).successRps += val;
    bucket(ruleKey, parsed.routeNamespace, parsed.routeName).successRps += val;
  }

  return Array.from(byKey.entries()).map(([key, b]) => {
    const successPct = b.totalRps > 0 ? clamp((100 * b.successRps) / b.totalRps, 0, 100) : 100;
    return {
      key,
      routeNamespace: b.routeNamespace,
      routeName: b.routeName,
      rps: b.totalRps,
      successPct,
    };
  });
}
