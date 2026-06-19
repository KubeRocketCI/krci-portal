import { describe, expect, it } from "vitest";
import type { NetworkingData } from "../types";
import { buildGraph, overlayMetrics } from "./useTopologyGraphData";
import type { EdgeMeta } from "./useTopologyGraphData";

const emptyData: NetworkingData = {
  gateways: [],
  httpRoutes: [],
  ingresses: [],
  policies: [],
  podsByService: {},
};

/** One gateway named "eg" with no conditions (neutral health). */
const gatewayBase = {
  name: "eg",
  namespace: "ns",
  generation: 1,
  gatewayClassName: "eg",
  conditions: [],
  listeners: [],
  addresses: [],
};

/** Minimal HTTPRoute parent condition set (all True). */
const parentConditions = [
  {
    parentName: "eg",
    conditions: [
      { type: "Accepted", status: "True" as const, reason: "Accepted" },
      { type: "ResolvedRefs", status: "True" as const, reason: "ResolvedRefs" },
    ],
  },
];

describe("buildGraph", () => {
  describe("FIX 1 — canary split: showWeight + weight correctly set", () => {
    it("sets showWeight=true and correct weights on both edges when 2 backends share a ruleIndex (canary)", () => {
      const data: NetworkingData = {
        ...emptyData,
        gateways: [gatewayBase],
        httpRoutes: [
          {
            name: "my-route",
            namespace: "ns",
            generation: 1,
            hostnames: ["example.com"],
            parentRefs: [{ name: "eg" }],
            parentConditions,
            // One spec rule (ruleIndex=0) with two backends → canary split
            rules: [
              {
                hostnames: ["example.com"],
                pathType: "PathPrefix",
                pathValue: "/",
                backendName: "svc-stable",
                backendPort: 8080,
                weight: 90,
                ruleIndex: 0,
              },
              {
                hostnames: ["example.com"],
                pathType: "PathPrefix",
                pathValue: "/",
                backendName: "svc-canary",
                backendPort: 8080,
                weight: 10,
                ruleIndex: 0,
              },
            ],
          },
        ],
      };

      const { edges } = buildGraph(data);
      const routeEdges = edges.filter((e) => e.source === "route:my-route");
      expect(routeEdges).toHaveLength(2);

      const stableEdge = routeEdges.find((e) => e.target === "backend:svc-stable:8080");
      const canaryEdge = routeEdges.find((e) => e.target === "backend:svc-canary:8080");

      expect(stableEdge).toBeDefined();
      expect(canaryEdge).toBeDefined();

      const stableMeta = stableEdge!.data as EdgeMeta;
      const canaryMeta = canaryEdge!.data as EdgeMeta;

      expect(stableMeta.showWeight).toBe(true);
      expect(canaryMeta.showWeight).toBe(true);

      expect(stableMeta.weight).toBe(90);
      expect(canaryMeta.weight).toBe(10);

      expect(stableMeta.ruleIndex).toBe(0);
      expect(canaryMeta.ruleIndex).toBe(0);
    });
  });

  describe("FIX 1 — path-routing: showWeight=false, weight=100, no misleading label", () => {
    it("sets showWeight=false on each edge when 2 rules have distinct ruleIndexes (path routing)", () => {
      const data: NetworkingData = {
        ...emptyData,
        gateways: [gatewayBase],
        httpRoutes: [
          {
            name: "path-route",
            namespace: "ns",
            generation: 1,
            hostnames: ["example.com"],
            parentRefs: [{ name: "eg" }],
            parentConditions,
            // Two spec rules (distinct ruleIndexes), each with one backend
            rules: [
              {
                hostnames: ["example.com"],
                pathType: "PathPrefix",
                pathValue: "/api",
                backendName: "svc-api",
                backendPort: 8080,
                weight: 100,
                ruleIndex: 0,
              },
              {
                hostnames: ["example.com"],
                pathType: "PathPrefix",
                pathValue: "/web",
                backendName: "svc-web",
                backendPort: 9090,
                weight: 100,
                ruleIndex: 1,
              },
            ],
          },
        ],
      };

      const { edges } = buildGraph(data);
      const routeEdges = edges.filter((e) => e.source === "route:path-route");
      expect(routeEdges).toHaveLength(2);

      routeEdges.forEach((e) => {
        const meta = e.data as EdgeMeta;
        // Path-routing: sole backend per rule → showWeight must be false (no "100%" label)
        expect(meta.showWeight).toBe(false);
        expect(meta.weight).toBe(100);
      });
    });
  });

  describe("FIX 2 — duplicate edge ids: two rules targeting the same backend:port", () => {
    it("produces DISTINCT edge ids when two rules target the same backend service:port", () => {
      const data: NetworkingData = {
        ...emptyData,
        gateways: [gatewayBase],
        httpRoutes: [
          {
            name: "dup-route",
            namespace: "ns",
            generation: 1,
            hostnames: ["example.com"],
            parentRefs: [{ name: "eg" }],
            parentConditions,
            // Two distinct spec rules (ruleIndex 0 and 1) pointing at the same backend
            rules: [
              {
                hostnames: ["example.com"],
                pathType: "PathPrefix",
                pathValue: "/v1",
                backendName: "shared-svc",
                backendPort: 8080,
                weight: 100,
                ruleIndex: 0,
              },
              {
                hostnames: ["example.com"],
                pathType: "PathPrefix",
                pathValue: "/v2",
                backendName: "shared-svc",
                backendPort: 8080,
                weight: 100,
                ruleIndex: 1,
              },
            ],
          },
        ],
      };

      const { edges } = buildGraph(data);
      const routeEdges = edges.filter((e) => e.source === "route:dup-route");
      // Must have 2 distinct edges, not 1 (React Flow would drop the duplicate)
      expect(routeEdges).toHaveLength(2);

      const ids = routeEdges.map((e) => e.id);
      expect(ids[0]).not.toBe(ids[1]);

      // Both edges should have showWeight=false (each rule has only 1 backend)
      routeEdges.forEach((e) => {
        const meta = e.data as EdgeMeta;
        expect(meta.showWeight).toBe(false);
      });

      const ruleIndexes = routeEdges.map((e) => (e.data as EdgeMeta).ruleIndex);
      expect(ruleIndexes).toContain(0);
      expect(ruleIndexes).toContain(1);
    });
  });

  describe("FIX 1 — canary under app-scope filter: weight still drives apportioning", () => {
    it("when canary partner is filtered by appName, the visible edge retains its weight", () => {
      const data: NetworkingData = {
        ...emptyData,
        gateways: [gatewayBase],
        httpRoutes: [
          {
            name: "canary-route",
            namespace: "ns",
            generation: 1,
            hostnames: ["example.com"],
            parentRefs: [{ name: "eg" }],
            parentConditions,
            rules: [
              {
                hostnames: ["example.com"],
                pathType: "PathPrefix",
                pathValue: "/",
                backendName: "svc-stable",
                backendPort: 8080,
                weight: 90,
                ruleIndex: 0,
              },
              {
                hostnames: ["example.com"],
                pathType: "PathPrefix",
                pathValue: "/",
                backendName: "svc-canary",
                backendPort: 8080,
                weight: 10,
                ruleIndex: 0,
              },
            ],
          },
        ],
      };

      // App-scope to svc-canary only → svc-stable partner is filtered out
      const { edges } = buildGraph(data, { appName: "svc-canary" });
      const routeEdges = edges.filter((e) => e.source === "route:canary-route");
      expect(routeEdges).toHaveLength(1);

      const meta = routeEdges[0].data as EdgeMeta;
      // weight must still be 10 (the canary's within-rule share), not undefined
      expect(meta.weight).toBe(10);
      // showWeight is false because the sibling backend was filtered out — the "%" label
      // is suppressed while the weight value still apportions rps correctly.
      expect(meta.showWeight).toBe(false);
    });
  });
});

describe("overlayMetrics", () => {
  it("returns baseEdges unchanged when metrics.available is false", () => {
    const data: NetworkingData = {
      ...emptyData,
      httpRoutes: [
        {
          name: "r",
          namespace: "ns",
          generation: 1,
          hostnames: [],
          parentRefs: [],
          parentConditions: [],
          rules: [{ hostnames: [], backendName: "svc", backendPort: 80, weight: 100, ruleIndex: 0 }],
        },
      ],
    };
    const { edges: base } = buildGraph(data);
    const result = overlayMetrics(base, data, { available: false, byKey: new Map() });
    expect(result).toBe(base);
  });

  it("apportions canary edge rps by weight fraction even when partner is absent", () => {
    const data: NetworkingData = {
      ...emptyData,
      gateways: [gatewayBase],
      httpRoutes: [
        {
          name: "canary-route",
          namespace: "ns",
          generation: 1,
          hostnames: ["example.com"],
          parentRefs: [{ name: "eg" }],
          parentConditions,
          rules: [
            {
              hostnames: ["example.com"],
              pathType: "PathPrefix",
              pathValue: "/",
              backendName: "svc-canary",
              backendPort: 8080,
              weight: 10,
              ruleIndex: 0,
            },
          ],
        },
      ],
    };

    const { edges: base } = buildGraph(data, { appName: "svc-canary" });

    const metricsMap = new Map([["ns/canary-route/0", { rps: 100, successPct: 99 }]]);
    const result = overlayMetrics(base, data, { available: true, byKey: metricsMap });

    const canaryEdge = result.find((e) => e.source === "route:canary-route");
    expect(canaryEdge).toBeDefined();
    const meta = canaryEdge!.data as EdgeMeta;
    // 100 rps * 10% weight = 10 rps (not the full 100 that the old code produced)
    expect(meta.rps).toBeCloseTo(10);
    expect(meta.success).toBe(99);
  });

  it("gateway→route edge gets rps+success from route-level key; weight/showWeight untouched", () => {
    const data: NetworkingData = {
      ...emptyData,
      gateways: [gatewayBase],
      httpRoutes: [
        {
          name: "my-route",
          namespace: "stage-ns",
          generation: 1,
          hostnames: ["example.com"],
          parentRefs: [{ name: "eg" }],
          parentConditions,
          rules: [
            {
              hostnames: ["example.com"],
              pathType: "PathPrefix",
              pathValue: "/",
              backendName: "svc",
              backendPort: 8080,
              weight: 100,
              ruleIndex: 0,
            },
          ],
        },
      ],
    };

    const { edges: base } = buildGraph(data);

    // Metrics keyed by the ROUTE-LEVEL key (no ruleIndex suffix) — the branch under test.
    const metricsMap = new Map([["stage-ns/my-route", { rps: 55, successPct: 98.5 }]]);
    const result = overlayMetrics(base, data, { available: true, byKey: metricsMap });

    const gwRouteEdge = result.find((e) => e.source === "gw:eg" && e.target === "route:my-route");
    expect(gwRouteEdge).toBeDefined();

    const meta = gwRouteEdge!.data as EdgeMeta;
    expect(meta.rps).toBeCloseTo(55);
    expect(meta.success).toBe(98.5);

    // weight and showWeight must not be set on a gw→route edge (only route→backend carries these)
    expect(meta.weight).toBeUndefined();
    expect(meta.showWeight).toBeUndefined();
  });

  it("sole-backend edge (weight=100) gets full rule rps (fraction=1)", () => {
    const data: NetworkingData = {
      ...emptyData,
      gateways: [gatewayBase],
      httpRoutes: [
        {
          name: "simple-route",
          namespace: "ns",
          generation: 1,
          hostnames: ["example.com"],
          parentRefs: [{ name: "eg" }],
          parentConditions,
          rules: [
            {
              hostnames: ["example.com"],
              pathType: "PathPrefix",
              pathValue: "/",
              backendName: "svc",
              backendPort: 8080,
              weight: 100,
              ruleIndex: 0,
            },
          ],
        },
      ],
    };

    const { edges: base } = buildGraph(data);
    const metricsMap = new Map([["ns/simple-route/0", { rps: 42, successPct: 100 }]]);
    const result = overlayMetrics(base, data, { available: true, byKey: metricsMap });

    const routeEdge = result.find((e) => e.source === "route:simple-route");
    expect(routeEdge).toBeDefined();
    expect((routeEdge!.data as EdgeMeta).rps).toBeCloseTo(42);
  });
});
