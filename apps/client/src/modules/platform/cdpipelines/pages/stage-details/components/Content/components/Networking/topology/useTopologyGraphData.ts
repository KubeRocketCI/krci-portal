import React from "react";
import { Edge, Node } from "@xyflow/react";
import type { NetGateway, NetHTTPRoute, NetIngress, NetPod, NetworkingData } from "../types";
import type { ExposureMetrics } from "../live/useExposureMetrics";
import { conditionColor } from "../utils";
import { NET_NODE_KIND, type Health } from "./constants";
import { getLayoutedElements } from "./layoutUtils";

export type InternetNodeData = Record<string, never>;
export type GatewayNodeData = { gateway: NetGateway; health: Health; policyCount: number };
export type RouteNodeData = {
  route: NetHTTPRoute;
  health: Health;
  host: string;
  policyCount: number;
  filterCount: number;
};
export type IngressNodeData = { ingress: NetIngress; health: Health };
export type BackendNodeData = { name: string; port: number; health: Health };
export type PodNodeData = { pod: NetPod; health: Health };

export type TopoNode = Node;

/** Options: scope the graph to one Application and/or show pods behind services. */
export type GraphOptions = { appName?: string; showPods?: boolean };

const order: Record<Health, number> = { neutral: 0, green: 1, amber: 2, red: 3 };
const worst = (colors: Health[]): Health =>
  colors.reduce<Health>((acc, c) => (order[c] > order[acc] ? c : acc), "neutral");

export const gatewayHealth = (gw: NetGateway): Health =>
  worst(gw.conditions.map((c) => conditionColor(c.status, c.reason)));

export const routeHealth = (route: NetHTTPRoute): Health =>
  worst(route.parentConditions.flatMap((pc) => pc.conditions.map((c) => conditionColor(c.status, c.reason))));

const podHealth = (pod: NetPod): Health => {
  if (pod.ready && pod.status === "Running") return "green";
  if (pod.status === "Pending" || pod.status === "ContainerCreating") return "amber";
  return "red";
};

const countPolicies = (data: NetworkingData, targetKind: "Gateway" | "HTTPRoute", name: string): number =>
  data.policies.filter((p) => p.targetKind === targetKind && p.targetName === name).length;

/**
 * Edge metadata consumed by the topology renderer to draw Kiali-style traffic labels.
 * All traffic fields are optional — undefined means "no data" (never faked).
 *
 * ruleIndex  — present only on route→backend edges; carries the HTTPRoute spec.rules
 *              index so that overlayMetrics can join to the per-rule Envoy metric instead
 *              of the (inflated) route-level aggregate.
 * weight     — within-spec-rule share percentage (drives rps apportioning). A sole
 *              backend in a rule gets weight=100; canary 90/10 → weight=90 and weight=10.
 * showWeight — true only when ≥2 backends share the same ruleIndex (genuine canary split).
 *              Drives the "X%" label; decoupled from weight so path-routing routes with
 *              one backend per rule never show a misleading "100%" label.
 */
export type EdgeMeta = {
  rps?: number;
  success?: number;
  weight?: number;
  showWeight?: boolean;
  health?: Health;
  ruleIndex?: number;
};

/**
 * Build nodes + base edges (health/weight only, NO metric labels) for the exposure topology.
 * Keeping metrics out of this function ensures nodes/edges are stable across React-Query
 * heartbeats — only the overlay step (overlayMetrics) needs to rerun when metrics change.
 */
export const buildGraph = (data: NetworkingData, opts: GraphOptions = {}): { nodes: TopoNode[]; edges: Edge[] } => {
  const { appName, showPods } = opts;
  const nodes: TopoNode[] = [];
  const edges: Edge[] = [];
  const at = { x: 0, y: 0 };

  // App scope: keep only routes/ingresses that route to this app's Service, the
  // gateways they attach to, and that app's backends.
  const isAppBackend = (name?: string) => !appName || name === appName;
  const routes = appName
    ? data.httpRoutes.filter((r) => r.rules.some((rule) => rule.backendName === appName))
    : data.httpRoutes;
  const ingresses = appName
    ? data.ingresses.filter((i) => i.rules.some((rule) => rule.backendName === appName))
    : data.ingresses;
  const parentNames = new Set(routes.flatMap((r) => r.parentRefs.map((p) => p.name)));
  const gateways = appName ? data.gateways.filter((g) => parentNames.has(g.name)) : data.gateways;

  const hasEntry = gateways.length > 0 || ingresses.length > 0;
  if (hasEntry) {
    nodes.push({ id: "internet", type: NET_NODE_KIND.INTERNET, data: {}, position: { ...at } });
  }

  const gatewayNames = new Set(gateways.map((g) => g.name));
  const backendSeen = new Set<string>();
  const podSeen = new Set<string>();

  // Create a backend (Service) node and, when enabled, the pods behind it.
  const addBackend = (name: string, port: number): string => {
    const backendId = `backend:${name}:${port}`;
    if (!backendSeen.has(backendId)) {
      backendSeen.add(backendId);
      nodes.push({
        id: backendId,
        type: NET_NODE_KIND.BACKEND,
        data: { name, port, health: "neutral" as Health },
        position: { ...at },
      });
      if (showPods) {
        const pods = data.podsByService?.[name] ?? [];
        pods.forEach((pod) => {
          const podId = `pod:${name}:${pod.name}`;
          if (!podSeen.has(podId)) {
            podSeen.add(podId);
            nodes.push({
              id: podId,
              type: NET_NODE_KIND.POD,
              data: { pod, health: podHealth(pod) },
              position: { ...at },
            });
          }
          const ph = podHealth(pod);
          const pe = `e:${backendId}->${podId}`;
          edges.push({
            id: pe,
            source: backendId,
            target: podId,
            // backend→pod: pod health; no real metrics at this level
            data: { health: ph } satisfies EdgeMeta,
          });
        });
      }
    }
    return backendId;
  };

  gateways.forEach((gw) => {
    const gwHealth = gatewayHealth(gw);
    nodes.push({
      id: `gw:${gw.name}`,
      type: NET_NODE_KIND.GATEWAY,
      data: { gateway: gw, health: gwHealth, policyCount: countPolicies(data, "Gateway", gw.name) },
      position: { ...at },
    });
    // internet→gw: color by gateway health; no real rps at this level
    const ie = `e:internet->gw:${gw.name}`;
    edges.push({
      id: ie,
      source: "internet",
      target: `gw:${gw.name}`,
      data: { health: gwHealth } satisfies EdgeMeta,
    });
  });

  routes.forEach((route) => {
    const rh = routeHealth(route);
    // Count total unique filters across all rules (by type+summary deduplication).
    const filterSeen = new Set<string>();
    for (const rule of route.rules) {
      for (const f of rule.filters ?? []) {
        filterSeen.add(`${f.type}::${f.summary}`);
      }
    }
    nodes.push({
      id: `route:${route.name}`,
      type: NET_NODE_KIND.ROUTE,
      data: {
        route,
        health: rh,
        host: route.hostnames[0] ?? "*",
        policyCount: countPolicies(data, "HTTPRoute", route.name),
        filterCount: filterSeen.size,
      },
      position: { ...at },
    });

    route.parentRefs.forEach((pr) => {
      if (!gatewayNames.has(pr.name)) return;
      const gre = `e:gw:${pr.name}->route:${route.name}`;
      edges.push({
        id: gre,
        source: `gw:${pr.name}`,
        target: `route:${route.name}`,
        // gw→route: route health only; metrics overlaid in overlayMetrics
        data: { health: rh } satisfies EdgeMeta,
      });
    });

    // Only count rules that actually have a backend (skip RequestRedirect etc.).
    const backendRules = route.rules.filter((r) => r.backendName && isAppBackend(r.backendName));

    backendRules.forEach((rule) => {
      const backendId = addBackend(rule.backendName, rule.backendPort);
      // FIX 2: include ruleIndex in the edge id so two distinct spec rules that
      // happen to target the same backend:port get distinct edge ids (avoids
      // React Flow silently dropping one and losing its metric).
      const be = `e:route:${route.name}->${backendId}:r${rule.ruleIndex}`;

      // FIX 1: decouple weight (apportioning) from showWeight (label visibility).
      // - weight is ALWAYS set to the within-rule share — drives rps apportioning
      //   even when the canary partner is filtered out by appName scope.
      // - showWeight is true only when ≥2 backends share this ruleIndex (genuine
      //   canary split); keeps path-routing routes free of misleading "100%" labels.
      const siblingCount = backendRules.filter((r) => r.ruleIndex === rule.ruleIndex).length;
      const showWeight = siblingCount > 1;

      edges.push({
        id: be,
        source: `route:${route.name}`,
        target: backendId,
        data: { health: rh, weight: rule.weight, showWeight, ruleIndex: rule.ruleIndex } satisfies EdgeMeta,
      });
    });
  });

  ingresses.forEach((ing) => {
    nodes.push({
      id: `ing:${ing.name}`,
      type: NET_NODE_KIND.INGRESS,
      data: { ingress: ing, health: "neutral" as Health },
      position: { ...at },
    });
    // internet→ing: neutral; ing→backend: neutral (no Envoy metrics for plain Ingress)
    const iie = `e:internet->ing:${ing.name}`;
    edges.push({
      id: iie,
      source: "internet",
      target: `ing:${ing.name}`,
      data: { health: "neutral" } satisfies EdgeMeta,
    });

    ing.rules
      .filter((rule) => rule.backendName && isAppBackend(rule.backendName))
      .forEach((rule) => {
        const backendId = addBackend(rule.backendName!, rule.backendPort ?? 0);
        const ibe = `e:ing:${ing.name}->${backendId}`;
        edges.push({
          id: ibe,
          source: `ing:${ing.name}`,
          target: backendId,
          data: { health: "neutral" } satisfies EdgeMeta,
        });
      });
  });

  return { nodes, edges };
};

/**
 * Overlay Prometheus metrics onto base edges.
 * Returns a NEW edges array with rps/success filled in where available.
 * Called in a separate useMemo so it reruns on heartbeats WITHOUT invalidating nodes.
 *
 * Key strategy:
 *  - gw→route edge  → looks up the ROUTE-LEVEL aggregate key "<ns>/<route>"
 *    (sum of all rules; correct total for the gateway→route link).
 *  - route→backend  → looks up the PER-RULE key "<ns>/<route>/<ruleIndex>"
 *    (only that rule's traffic) then apportions by weightFraction for canary
 *    splits. This prevents N× inflation on multi-rule HTTPRoutes where every
 *    rule's Envoy cluster is a separate metric.
 */
export const overlayMetrics = (
  baseEdges: Edge[],
  data: NetworkingData,
  metrics: ExposureMetrics | undefined
): Edge[] => {
  if (!metrics?.available) return baseEdges;

  // Build a lookup: routeName → route namespace (for key construction).
  // Edge ids encode the route name; namespace comes from NetworkingData.
  const routeNsByName = new Map<string, string>();
  for (const route of data.httpRoutes) {
    routeNsByName.set(route.name, route.namespace);
  }

  return baseEdges.map((edge) => {
    const edgeMeta = (edge.data ?? {}) as Partial<EdgeMeta>;

    // Determine edge kind and extract routeName.
    // FIX 2: overlayMetrics uses edge.source / edge.data (NOT the full edge id)
    // to find the route name and ruleIndex, so the id format is irrelevant here.
    //
    //   gw→route edge:     source = "gw:<gwName>",    target = "route:<routeName>"
    //   route→backend edge: source = "route:<routeName>", target = "backend:<name>:<port>"
    let routeName: string | undefined;
    let isRouteToBackend = false;

    if (edge.source.startsWith("gw:") && edge.target.startsWith("route:")) {
      routeName = edge.target.slice("route:".length);
    } else if (edge.source.startsWith("route:")) {
      routeName = edge.source.slice("route:".length);
      isRouteToBackend = true;
    }

    if (!routeName) return edge;

    const ns = routeNsByName.get(routeName);
    if (!ns) return edge;

    if (isRouteToBackend) {
      // Per-rule join: use "<ns>/<route>/<ruleIndex>" so each backend sees only
      // its own rule's traffic, not the inflated full-route total.
      const ruleIndex = edgeMeta.ruleIndex;
      if (ruleIndex === undefined) return edge;
      const ruleKey = `${ns}/${routeName}/${ruleIndex}`;
      const ruleMetric = metrics.byKey.get(ruleKey);
      if (!ruleMetric) return edge;

      // FIX 1: weight is always present (sole backend → 100, canary backend → its %).
      // Apportioning is therefore always correct even when the canary partner is
      // hidden by app-scope filtering (weight=10 → fraction=0.1, never inflated to 1).
      const weight = edgeMeta.weight;
      const weightFraction = weight !== undefined ? weight / 100 : 1;

      const overlaid: EdgeMeta = {
        ...edgeMeta,
        rps: ruleMetric.rps * weightFraction,
        success: ruleMetric.successPct,
      };
      return { ...edge, data: overlaid };
    } else {
      // Gateway→route edge: use the route-level aggregate (sum of all rules).
      const routeKey = `${ns}/${routeName}`;
      const routeMetric = metrics.byKey.get(routeKey);
      if (!routeMetric) return edge;

      const overlaid: EdgeMeta = {
        ...edgeMeta,
        rps: routeMetric.rps,
        success: routeMetric.successPct,
      };
      return { ...edge, data: overlaid };
    }
  });
};

export const useTopologyGraphData = (
  data: NetworkingData,
  direction: "LR" | "TB",
  opts: GraphOptions = {},
  metrics?: ExposureMetrics
) => {
  // Stable shape memo: only recomputes when actual topology changes (not on metric heartbeats).
  const { nodes: baseNodes, edges: baseEdges } = React.useMemo(
    () => buildGraph(data, opts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, opts.appName, opts.showPods]
  );

  // Layout is keyed on nodes + direction only; does NOT include metrics.
  const { nodes } = React.useMemo(
    () => getLayoutedElements(baseNodes, baseEdges, direction),
    [baseNodes, baseEdges, direction]
  );

  // Metric overlay: reruns on every heartbeat but ONLY produces new edge objects —
  // nodes identity is unaffected, so NetworkTopology's node-layout effect stays quiet.
  // data is stable across heartbeats (memoized upstream in NetworkingLive) — any
  // httpRoutes change also produces a new baseEdges reference, so the dep is cheap.
  const edges = React.useMemo(() => overlayMetrics(baseEdges, data, metrics), [baseEdges, data, metrics]);

  return { nodes, edges, baseEdges };
};
