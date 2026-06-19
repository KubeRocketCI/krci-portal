import { describe, expect, it } from "vitest";
import type { Gateway, HTTPRoute, Ingress, Pod, SecurityPolicy, Service } from "@my-project/shared";
import { buildNetworkingData } from "./buildNetworkingData";

// ─── Fixtures copied from .design-harvest/live/ ──────────────────────────────

const gatewayFixture: Gateway = {
  apiVersion: "gateway.networking.k8s.io/v1",
  kind: "Gateway",
  metadata: {
    annotations: {
      "kubectl.kubernetes.io/last-applied-configuration":
        '{"apiVersion":"gateway.networking.k8s.io/v1","kind":"Gateway","metadata":{"annotations":{},"name":"eg","namespace":"krci-demo-dev"},"spec":{"gatewayClassName":"eg","listeners":[{"allowedRoutes":{"namespaces":{"from":"Same"}},"hostname":"*.krci-demo-dev.127.0.0.1.nip.io","name":"http","port":80,"protocol":"HTTP"}]}}',
    },
    creationTimestamp: "2026-06-13T15:34:42Z",
    generation: 1,
    name: "eg",
    namespace: "krci-demo-dev",
    resourceVersion: "28695",
    uid: "5c53c99f-346d-4eb1-b0e3-387e3011cc6e",
  },
  spec: {
    gatewayClassName: "eg",
    listeners: [
      {
        allowedRoutes: { namespaces: { from: "Same" } },
        hostname: "*.krci-demo-dev.127.0.0.1.nip.io",
        name: "http",
        port: 80,
        protocol: "HTTP",
      },
    ],
  } as unknown as Gateway["spec"],
  status: {
    conditions: [
      {
        lastTransitionTime: "2026-06-13T15:34:53Z",
        message: "The Gateway has been scheduled by Envoy Gateway",
        observedGeneration: 1,
        reason: "Accepted",
        status: "True",
        type: "Accepted",
      },
      {
        lastTransitionTime: "2026-06-13T15:34:53Z",
        message: "No addresses have been assigned to the Gateway",
        observedGeneration: 1,
        reason: "AddressNotAssigned",
        status: "False",
        type: "Programmed",
      },
    ],
    listeners: [
      {
        attachedRoutes: 1,
        conditions: [
          {
            lastTransitionTime: "2026-06-13T15:34:53Z",
            message: "Sending translated listener configuration to the data plane",
            observedGeneration: 1,
            reason: "Programmed",
            status: "True",
            type: "Programmed",
          },
          {
            lastTransitionTime: "2026-06-13T15:34:53Z",
            message: "Listener has been successfully translated",
            observedGeneration: 1,
            reason: "Accepted",
            status: "True",
            type: "Accepted",
          },
          {
            lastTransitionTime: "2026-06-13T15:34:53Z",
            message: "Listener references have been resolved",
            observedGeneration: 1,
            reason: "ResolvedRefs",
            status: "True",
            type: "ResolvedRefs",
          },
        ],
        name: "http",
        supportedKinds: [
          { group: "gateway.networking.k8s.io", kind: "HTTPRoute" },
          { group: "gateway.networking.k8s.io", kind: "GRPCRoute" },
        ],
      },
    ],
  } as unknown as Gateway["status"],
};

const httpRouteFixture: HTTPRoute = {
  apiVersion: "gateway.networking.k8s.io/v1",
  kind: "HTTPRoute",
  metadata: {
    annotations: {
      "kubectl.kubernetes.io/last-applied-configuration":
        '{"apiVersion":"gateway.networking.k8s.io/v1","kind":"HTTPRoute","metadata":{"annotations":{},"labels":{"app.kubernetes.io/instance":"test-go-app","app.kubernetes.io/name":"test-go-app"},"name":"test-go-app","namespace":"krci-demo-dev"},"spec":{"hostnames":["test-go-app.krci-demo-dev.127.0.0.1.nip.io"],"parentRefs":[{"name":"eg"}],"rules":[{"backendRefs":[{"name":"test-go-app","port":8080}],"matches":[{"path":{"type":"PathPrefix","value":"/"}}]}]}}',
    },
    creationTimestamp: "2026-06-13T15:34:42Z",
    generation: 1,
    labels: {
      "app.kubernetes.io/instance": "test-go-app",
      "app.kubernetes.io/name": "test-go-app",
    },
    name: "test-go-app",
    namespace: "krci-demo-dev",
    resourceVersion: "28605",
    uid: "8c39fb20-8a24-4725-8477-40489aa9d80f",
  },
  spec: {
    hostnames: ["test-go-app.krci-demo-dev.127.0.0.1.nip.io"],
    parentRefs: [
      {
        group: "gateway.networking.k8s.io",
        kind: "Gateway",
        name: "eg",
      },
    ],
    rules: [
      {
        backendRefs: [
          {
            group: "",
            kind: "Service",
            name: "test-go-app",
            port: 8080,
            weight: 1,
          },
        ],
        matches: [
          {
            path: {
              type: "PathPrefix",
              value: "/",
            },
          },
        ],
      },
    ],
  } as unknown as HTTPRoute["spec"],
  status: {
    parents: [
      {
        conditions: [
          {
            lastTransitionTime: "2026-06-13T15:34:42Z",
            message: "Route is accepted",
            observedGeneration: 1,
            reason: "Accepted",
            status: "True",
            type: "Accepted",
          },
          {
            lastTransitionTime: "2026-06-13T15:34:42Z",
            message: "Resolved all the Object references for the Route",
            observedGeneration: 1,
            reason: "ResolvedRefs",
            status: "True",
            type: "ResolvedRefs",
          },
        ],
        controllerName: "gateway.envoyproxy.io/gatewayclass-controller",
        parentRef: {
          group: "gateway.networking.k8s.io",
          kind: "Gateway",
          name: "eg",
        },
      },
    ],
  } as unknown as HTTPRoute["status"],
};

// Copied from .design-harvest/live/service-test-go-app.json
const serviceFixture: Service = {
  apiVersion: "v1",
  kind: "Service",
  metadata: {
    annotations: {},
    creationTimestamp: "2026-06-13T15:30:25Z",
    labels: {
      "app.kubernetes.io/instance": "test-go-app",
      "app.kubernetes.io/managed-by": "Helm",
      "app.kubernetes.io/name": "test-go-app",
      "app.kubernetes.io/version": "0.1.0",
      "helm.sh/chart": "test-go-app-0.1.0",
    },
    name: "test-go-app",
    namespace: "krci-demo-dev",
    resourceVersion: "27292",
    uid: "f482f75c-6fe2-4b4d-a0fc-95c5de0a6ba3",
  },
  spec: {
    clusterIP: "10.96.56.149",
    ports: [
      {
        name: "http",
        port: 8080,
        protocol: "TCP",
        targetPort: "http",
      },
    ],
    selector: {
      "app.kubernetes.io/instance": "test-go-app",
      "app.kubernetes.io/name": "test-go-app",
    },
    type: "ClusterIP",
  },
};

// Copied from .design-harvest/live/pods-test-go-app.json (items[0])
const podFixture: Pod = {
  apiVersion: "v1",
  kind: "Pod",
  metadata: {
    creationTimestamp: "2026-06-13T15:30:25Z",
    labels: {
      "app.kubernetes.io/instance": "test-go-app",
      "app.kubernetes.io/managed-by": "Helm",
      "app.kubernetes.io/name": "test-go-app",
      "app.kubernetes.io/version": "0.1.0",
      "helm.sh/chart": "test-go-app-0.1.0",
      "pod-template-hash": "7c8bc999c8",
    },
    name: "test-go-app-7c8bc999c8-cnslg",
    namespace: "krci-demo-dev",
    resourceVersion: "27417",
    uid: "441d647d-e959-467a-aa30-bc554163b285",
  },
  spec: {
    containers: [
      {
        name: "test-go-app",
        image:
          "gitlab.127.0.0.1.nip.io:5050/krci/test-go-app:main-20260613-152851@sha256:51e903abbbf00b56866d29c609988cdc2cac9133cf1304148e25579882112449",
      },
    ],
  },
  status: {
    phase: "Running",
    containerStatuses: [
      {
        name: "test-go-app",
        ready: true,
        restartCount: 0,
        image: "sha256:71b10f8853d0ebeb2a2bf3dbcd00d6b211b1cd663cfef5f5e000983c26de45cd",
        imageID:
          "gitlab.127.0.0.1.nip.io:5050/krci/test-go-app@sha256:51e903abbbf00b56866d29c609988cdc2cac9133cf1304148e25579882112449",
        state: {
          running: {
            startedAt: "2026-06-13T15:30:26Z",
          },
        },
      },
    ],
  },
} as unknown as Pod;

// Copied from .design-harvest/live/securitypolicy.json
const securityPolicyFixture: SecurityPolicy = {
  apiVersion: "gateway.envoyproxy.io/v1alpha1",
  kind: "SecurityPolicy",
  metadata: {
    annotations: {},
    creationTimestamp: "2026-06-13T16:50:19Z",
    generation: 1,
    name: "test-go-app-cors",
    namespace: "krci-demo-dev",
    resourceVersion: "44354",
    uid: "7d3ede1d-9b8d-4b8a-bb36-de2e71fc0a26",
  },
  spec: {
    cors: {
      allowMethods: ["GET", "POST"],
      allowOrigins: ["https://example.com"],
    },
    targetRefs: [
      {
        group: "gateway.networking.k8s.io",
        kind: "HTTPRoute",
        name: "test-go-app",
      },
    ],
  } as unknown as SecurityPolicy["spec"],
  status: {
    ancestors: [
      {
        ancestorRef: {
          group: "gateway.networking.k8s.io",
          kind: "Gateway",
          name: "eg",
          namespace: "krci-demo-dev",
        },
        conditions: [
          {
            lastTransitionTime: "2026-06-13T16:50:19Z",
            message: "Policy has been accepted.",
            observedGeneration: 1,
            reason: "Accepted",
            status: "True",
            type: "Accepted",
          },
        ],
        controllerName: "gateway.envoyproxy.io/gatewayclass-controller",
      },
    ],
  } as unknown as SecurityPolicy["status"],
};

// Copied from .design-harvest/live/envoy-service.json (items[0])
const envoyServiceFixture: Service = {
  apiVersion: "v1",
  kind: "Service",
  metadata: {
    creationTimestamp: "2026-06-13T15:34:42Z",
    labels: {
      "app.kubernetes.io/component": "proxy",
      "app.kubernetes.io/managed-by": "envoy-gateway",
      "app.kubernetes.io/name": "envoy",
      "gateway.envoyproxy.io/owning-gateway-name": "eg",
      "gateway.envoyproxy.io/owning-gateway-namespace": "krci-demo-dev",
    },
    name: "envoy-krci-demo-dev-eg-34d67e87",
    namespace: "envoy-gateway-system",
    resourceVersion: "28626",
    uid: "30a7c49d-59a0-44ac-9a4a-0e6d018aef01",
  },
  spec: {
    clusterIP: "10.96.238.101",
    ports: [
      {
        name: "http-80",
        nodePort: 32317,
        port: 80,
        protocol: "TCP",
        targetPort: 10080,
      },
    ],
    type: "LoadBalancer",
  },
} as unknown as Service;

// ─── HTTPRoute filter fixture (from .design-harvest/live/httproute-filtered.json) ──────────────────

const httpRouteFilteredFixture: HTTPRoute = {
  ...httpRouteFixture,
  metadata: {
    ...httpRouteFixture.metadata,
    generation: 2,
  },
  spec: {
    hostnames: ["test-go-app.krci-demo-dev.127.0.0.1.nip.io"],
    parentRefs: [
      {
        group: "gateway.networking.k8s.io",
        kind: "Gateway",
        name: "eg",
      },
    ],
    rules: [
      {
        backendRefs: [
          {
            group: "",
            kind: "Service",
            name: "test-go-app",
            port: 8080,
            weight: 1,
          },
        ],
        filters: [
          {
            requestHeaderModifier: {
              add: [{ name: "X-KRCI-Demo", value: "true" }],
              remove: ["X-Internal"],
            },
            type: "RequestHeaderModifier",
          },
          {
            type: "URLRewrite",
            urlRewrite: {
              path: {
                replacePrefixMatch: "/",
                type: "ReplacePrefixMatch",
              },
            },
          },
        ],
        matches: [
          {
            path: {
              type: "PathPrefix",
              value: "/",
            },
          },
        ],
      },
    ],
  } as unknown as HTTPRoute["spec"],
};

describe("buildNetworkingData", () => {
  it("returns empty slices when called with empty input", () => {
    const result = buildNetworkingData({ gateways: [], httpRoutes: [] });
    expect(result.gateways).toHaveLength(0);
    expect(result.httpRoutes).toHaveLength(0);
    expect(result.ingresses).toHaveLength(0);
    expect(result.policies).toHaveLength(0);
    expect(result.podsByService).toEqual({});
  });

  describe("Gateway mapping", () => {
    it("produces exactly 1 gateway with correct metadata", () => {
      const result = buildNetworkingData({ gateways: [gatewayFixture], httpRoutes: [] });
      expect(result.gateways).toHaveLength(1);
      const gw = result.gateways[0];
      expect(gw.name).toBe("eg");
      expect(gw.namespace).toBe("krci-demo-dev");
      expect(gw.generation).toBe(1);
      expect(gw.gatewayClassName).toBe("eg");
    });

    it("maps gateway conditions: Accepted=True and Programmed=False(AddressNotAssigned)", () => {
      const result = buildNetworkingData({ gateways: [gatewayFixture], httpRoutes: [] });
      const gw = result.gateways[0];

      const accepted = gw.conditions.find((c) => c.type === "Accepted");
      expect(accepted).toBeDefined();
      expect(accepted?.status).toBe("True");
      expect(accepted?.reason).toBe("Accepted");

      const programmed = gw.conditions.find((c) => c.type === "Programmed");
      expect(programmed).toBeDefined();
      expect(programmed?.status).toBe("False");
      expect(programmed?.reason).toBe("AddressNotAssigned");
    });

    it("maps listener 'http' with attachedRoutes=1", () => {
      const result = buildNetworkingData({ gateways: [gatewayFixture], httpRoutes: [] });
      const gw = result.gateways[0];

      expect(gw.listeners).toHaveLength(1);
      const listener = gw.listeners[0];
      expect(listener.name).toBe("http");
      expect(listener.protocol).toBe("HTTP");
      expect(listener.port).toBe(80);
      expect(listener.hostname).toBe("*.krci-demo-dev.127.0.0.1.nip.io");
      expect(listener.attachedRoutes).toBe(1);
    });

    it("merges status listener conditions into the spec listener", () => {
      const result = buildNetworkingData({ gateways: [gatewayFixture], httpRoutes: [] });
      const listener = result.gateways[0].listeners[0];

      expect(listener.conditions).toHaveLength(3);
      const accepted = listener.conditions.find((c) => c.type === "Accepted");
      expect(accepted?.status).toBe("True");
    });

    it("returns empty addresses array when no status.addresses and no envoyServices", () => {
      const result = buildNetworkingData({ gateways: [gatewayFixture], httpRoutes: [] });
      expect(result.gateways[0].addresses).toEqual([]);
    });

    it("surfaces NodePort and ClusterIP from envoy Service when status.addresses absent", () => {
      const result = buildNetworkingData({
        gateways: [gatewayFixture],
        httpRoutes: [],
        envoyServices: [envoyServiceFixture],
      });
      const gw = result.gateways[0];
      const nodePortAddr = gw.addresses.find((a) => a.type === "NodePort");
      expect(nodePortAddr).toBeDefined();
      expect(nodePortAddr?.value).toBe("32317");
      const clusterIPAddr = gw.addresses.find((a) => a.type === "ClusterIP");
      expect(clusterIPAddr).toBeDefined();
      expect(clusterIPAddr?.value).toBe("10.96.238.101");
    });

    it("prefers status.addresses over envoyService when both present", () => {
      const gwWithAddresses: Gateway = {
        ...gatewayFixture,
        status: {
          ...gatewayFixture.status,
          addresses: [{ type: "IPAddress", value: "1.2.3.4" }],
        } as unknown as Gateway["status"],
      };
      const result = buildNetworkingData({
        gateways: [gwWithAddresses],
        httpRoutes: [],
        envoyServices: [envoyServiceFixture],
      });
      const gw = result.gateways[0];
      expect(gw.addresses).toHaveLength(1);
      expect(gw.addresses[0]).toEqual({ type: "IPAddress", value: "1.2.3.4" });
    });
  });

  describe("HTTPRoute mapping", () => {
    it("produces exactly 1 httproute with correct metadata", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [httpRouteFixture] });
      expect(result.httpRoutes).toHaveLength(1);
      const route = result.httpRoutes[0];
      expect(route.name).toBe("test-go-app");
      expect(route.namespace).toBe("krci-demo-dev");
      expect(route.generation).toBe(1);
    });

    it("carries route-level hostnames", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [httpRouteFixture] });
      const route = result.httpRoutes[0];
      expect(route.hostnames).toEqual(["test-go-app.krci-demo-dev.127.0.0.1.nip.io"]);
    });

    it("maps parentRef to gateway 'eg'", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [httpRouteFixture] });
      const route = result.httpRoutes[0];
      expect(route.parentRefs).toHaveLength(1);
      expect(route.parentRefs[0].name).toBe("eg");
    });

    it("produces one rule per backendRef with correct backend and port", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [httpRouteFixture] });
      const route = result.httpRoutes[0];
      expect(route.rules).toHaveLength(1);
      const rule = route.rules[0];
      expect(rule.backendName).toBe("test-go-app");
      expect(rule.backendPort).toBe(8080);
      expect(rule.pathType).toBe("PathPrefix");
      expect(rule.pathValue).toBe("/");
    });

    it("sets ruleIndex=0 on the sole rule of a single-rule route", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [httpRouteFixture] });
      expect(result.httpRoutes[0].rules[0].ruleIndex).toBe(0);
    });

    it("copies route-level hostnames into each rule (no per-rule hostnames in Gateway API)", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [httpRouteFixture] });
      const rule = result.httpRoutes[0].rules[0];
      expect(rule.hostnames).toEqual(["test-go-app.krci-demo-dev.127.0.0.1.nip.io"]);
    });

    it("maps parentConditions: Accepted=True and ResolvedRefs=True", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [httpRouteFixture] });
      const route = result.httpRoutes[0];

      expect(route.parentConditions).toHaveLength(1);
      const pc = route.parentConditions[0];
      expect(pc.parentName).toBe("eg");

      const accepted = pc.conditions.find((c) => c.type === "Accepted");
      expect(accepted?.status).toBe("True");
      expect(accepted?.reason).toBe("Accepted");

      const resolvedRefs = pc.conditions.find((c) => c.type === "ResolvedRefs");
      expect(resolvedRefs?.status).toBe("True");
      expect(resolvedRefs?.reason).toBe("ResolvedRefs");
    });
  });

  describe("combined mapping", () => {
    it("maps both gateway and httproute together", () => {
      const result = buildNetworkingData({ gateways: [gatewayFixture], httpRoutes: [httpRouteFixture] });
      expect(result.gateways).toHaveLength(1);
      expect(result.httpRoutes).toHaveLength(1);
      expect(result.ingresses).toHaveLength(0);
      expect(result.policies).toHaveLength(0);
    });
  });

  describe("defensive: missing status", () => {
    it("tolerates a gateway with no status", () => {
      const noStatus: Gateway = { ...gatewayFixture, status: undefined };
      const result = buildNetworkingData({ gateways: [noStatus], httpRoutes: [] });
      const gw = result.gateways[0];
      expect(gw.conditions).toEqual([]);
      expect(gw.listeners[0].attachedRoutes).toBe(0);
      expect(gw.addresses).toEqual([]);
    });

    it("tolerates an httproute with no status", () => {
      const noStatus: HTTPRoute = { ...httpRouteFixture, status: undefined };
      const result = buildNetworkingData({ gateways: [], httpRoutes: [noStatus] });
      expect(result.httpRoutes[0].parentConditions).toEqual([]);
    });

    it("keeps a backend-less rule (e.g. RequestRedirect) so its filter is surfaced", () => {
      const redirectRoute = {
        ...httpRouteFixture,
        metadata: { ...httpRouteFixture.metadata, name: "redirect-route" },
        spec: {
          parentRefs: [{ name: "eg" }],
          hostnames: ["redirect.example.com"],
          rules: [
            {
              matches: [{ path: { type: "PathPrefix", value: "/" } }],
              filters: [{ type: "RequestRedirect", requestRedirect: { scheme: "https", statusCode: 301 } }],
            },
          ],
        },
      } as unknown as HTTPRoute;
      const route = buildNetworkingData({ gateways: [], httpRoutes: [redirectRoute] }).httpRoutes[0];
      expect(route.rules).toHaveLength(1);
      expect(route.rules[0].backendName).toBe("");
      expect(route.rules[0].filters?.[0]?.type).toBe("RequestRedirect");
    });
  });

  describe("ruleIndex assignment", () => {
    it("two single-backend rules get ruleIndex 0 and 1 respectively", () => {
      const multiRuleRoute = {
        ...httpRouteFixture,
        metadata: { ...httpRouteFixture.metadata, name: "multi-rule" },
        spec: {
          hostnames: ["multi.example.com"],
          parentRefs: [{ name: "eg" }],
          rules: [
            {
              matches: [{ path: { type: "PathPrefix", value: "/api" } }],
              backendRefs: [{ name: "svc-a", port: 8080, weight: 1 }],
            },
            {
              matches: [{ path: { type: "PathPrefix", value: "/web" } }],
              backendRefs: [{ name: "svc-b", port: 9090, weight: 1 }],
            },
          ],
        },
      } as unknown as HTTPRoute;
      const route = buildNetworkingData({ gateways: [], httpRoutes: [multiRuleRoute] }).httpRoutes[0];
      expect(route.rules).toHaveLength(2);
      expect(route.rules[0].backendName).toBe("svc-a");
      expect(route.rules[0].ruleIndex).toBe(0);
      expect(route.rules[1].backendName).toBe("svc-b");
      expect(route.rules[1].ruleIndex).toBe(1);
    });

    it("canary rule (1 rule, 2 backends) — both NetRoutingRule entries have the same ruleIndex=0", () => {
      const canaryRoute = {
        ...httpRouteFixture,
        metadata: { ...httpRouteFixture.metadata, name: "canary-route" },
        spec: {
          hostnames: ["canary.example.com"],
          parentRefs: [{ name: "eg" }],
          rules: [
            {
              matches: [{ path: { type: "PathPrefix", value: "/" } }],
              backendRefs: [
                { name: "svc-stable", port: 8080, weight: 90 },
                { name: "svc-canary", port: 8080, weight: 10 },
              ],
            },
          ],
        },
      } as unknown as HTTPRoute;
      const route = buildNetworkingData({ gateways: [], httpRoutes: [canaryRoute] }).httpRoutes[0];
      expect(route.rules).toHaveLength(2);
      expect(route.rules[0].backendName).toBe("svc-stable");
      expect(route.rules[0].ruleIndex).toBe(0);
      expect(route.rules[1].backendName).toBe("svc-canary");
      expect(route.rules[1].ruleIndex).toBe(0);
    });

    it("backend-less redirect rule also gets a ruleIndex", () => {
      const redirectRoute = {
        ...httpRouteFixture,
        metadata: { ...httpRouteFixture.metadata, name: "redirect-idx" },
        spec: {
          parentRefs: [{ name: "eg" }],
          hostnames: ["redirect.example.com"],
          rules: [
            {
              matches: [{ path: { type: "PathPrefix", value: "/" } }],
              filters: [{ type: "RequestRedirect", requestRedirect: { scheme: "https", statusCode: 301 } }],
            },
          ],
        },
      } as unknown as HTTPRoute;
      const route = buildNetworkingData({ gateways: [], httpRoutes: [redirectRoute] }).httpRoutes[0];
      expect(route.rules[0].ruleIndex).toBe(0);
    });
  });

  describe("showWeight flag", () => {
    it("single-backend rule sets showWeight=false (no misleading 100%)", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [httpRouteFixture] });
      const rule = result.httpRoutes[0].rules[0];
      expect(rule.showWeight).toBe(false);
    });

    it("canary rule (2 backendRefs in one spec rule) sets showWeight=true on each entry", () => {
      const canaryRoute = {
        ...httpRouteFixture,
        metadata: { ...httpRouteFixture.metadata, name: "canary-route" },
        spec: {
          hostnames: ["canary.example.com"],
          parentRefs: [{ name: "eg" }],
          rules: [
            {
              matches: [{ path: { type: "PathPrefix", value: "/" } }],
              backendRefs: [
                { name: "svc-stable", port: 8080, weight: 90 },
                { name: "svc-canary", port: 8080, weight: 10 },
              ],
            },
          ],
        },
      } as unknown as HTTPRoute;
      const route = buildNetworkingData({ gateways: [], httpRoutes: [canaryRoute] }).httpRoutes[0];
      expect(route.rules).toHaveLength(2);
      expect(route.rules[0].showWeight).toBe(true);
      expect(route.rules[1].showWeight).toBe(true);
    });

    it("backend-less rule (RequestRedirect) sets showWeight=false", () => {
      const redirectRoute = {
        ...httpRouteFixture,
        metadata: { ...httpRouteFixture.metadata, name: "redirect-sw" },
        spec: {
          parentRefs: [{ name: "eg" }],
          hostnames: ["redirect.example.com"],
          rules: [
            {
              matches: [{ path: { type: "PathPrefix", value: "/" } }],
              filters: [{ type: "RequestRedirect", requestRedirect: { scheme: "https", statusCode: 301 } }],
            },
          ],
        },
      } as unknown as HTTPRoute;
      const route = buildNetworkingData({ gateways: [], httpRoutes: [redirectRoute] }).httpRoutes[0];
      expect(route.rules[0].showWeight).toBe(false);
    });

    it("multi-rule route with one backend per rule — each rule has showWeight=false", () => {
      const multiRuleRoute = {
        ...httpRouteFixture,
        metadata: { ...httpRouteFixture.metadata, name: "multi-rule-sw" },
        spec: {
          hostnames: ["multi.example.com"],
          parentRefs: [{ name: "eg" }],
          rules: [
            {
              matches: [{ path: { type: "PathPrefix", value: "/api" } }],
              backendRefs: [{ name: "svc-a", port: 8080, weight: 1 }],
            },
            {
              matches: [{ path: { type: "PathPrefix", value: "/web" } }],
              backendRefs: [{ name: "svc-b", port: 9090, weight: 1 }],
            },
          ],
        },
      } as unknown as HTTPRoute;
      const route = buildNetworkingData({ gateways: [], httpRoutes: [multiRuleRoute] }).httpRoutes[0];
      expect(route.rules[0].showWeight).toBe(false);
      expect(route.rules[1].showWeight).toBe(false);
    });
  });

  describe("podsByService", () => {
    it("maps pods to the backend Service referenced by HTTPRoute rules", () => {
      const result = buildNetworkingData({
        gateways: [],
        httpRoutes: [httpRouteFixture],
        services: [serviceFixture],
        pods: [podFixture],
      });

      expect(result.podsByService).toBeDefined();
      const pods = result.podsByService?.["test-go-app"];
      expect(pods).toHaveLength(1);

      const pod = pods![0];
      expect(pod.name).toBe("test-go-app-7c8bc999c8-cnslg");
      expect(pod.status).toBe("Running");
      expect(pod.ready).toBe(true);
      expect(pod.restarts).toBe(0);
    });

    it("returns empty array for a Service with no matching pods", () => {
      const result = buildNetworkingData({
        gateways: [],
        httpRoutes: [httpRouteFixture],
        services: [serviceFixture],
        pods: [],
      });
      expect(result.podsByService?.["test-go-app"]).toEqual([]);
    });

    it("does not include pods that do not match the selector", () => {
      const differentPod: Pod = {
        ...podFixture,
        metadata: {
          ...podFixture.metadata,
          name: "other-pod",
          labels: { "app.kubernetes.io/name": "other-app" },
        },
      };
      const result = buildNetworkingData({
        gateways: [],
        httpRoutes: [httpRouteFixture],
        services: [serviceFixture],
        pods: [differentPod],
      });
      expect(result.podsByService?.["test-go-app"]).toEqual([]);
    });
  });

  describe("policies", () => {
    it("maps SecurityPolicy with correct fields", () => {
      const result = buildNetworkingData({
        gateways: [],
        httpRoutes: [],
        policies: { securityPolicies: [securityPolicyFixture] },
      });

      expect(result.policies).toHaveLength(1);
      const policy = result.policies[0];
      expect(policy.name).toBe("test-go-app-cors");
      expect(policy.namespace).toBe("krci-demo-dev");
      expect(policy.kind).toBe("SecurityPolicy");
      expect(policy.targetKind).toBe("HTTPRoute");
      expect(policy.targetName).toBe("test-go-app");
    });

    it("SecurityPolicy ancestorConditions: Accepted=True", () => {
      const result = buildNetworkingData({
        gateways: [],
        httpRoutes: [],
        policies: { securityPolicies: [securityPolicyFixture] },
      });
      const policy = result.policies[0];
      expect(policy.ancestorConditions).toHaveLength(1);
      const cond = policy.ancestorConditions[0];
      expect(cond.type).toBe("Accepted");
      expect(cond.status).toBe("True");
      expect(cond.reason).toBe("Accepted");
    });

    it("SecurityPolicy configSummary mentions cors", () => {
      const result = buildNetworkingData({
        gateways: [],
        httpRoutes: [],
        policies: { securityPolicies: [securityPolicyFixture] },
      });
      const policy = result.policies[0];
      expect(policy.configSummary).toBeDefined();
      expect(policy.configSummary).toContain("cors");
    });

    it("maps SecurityPolicy with singular spec.targetRef (no targetRefs array)", () => {
      const singularRef: SecurityPolicy = {
        ...securityPolicyFixture,
        metadata: { ...securityPolicyFixture.metadata, name: "gw-cors-policy" },
        spec: {
          cors: { allowOrigins: ["https://example.com"] },
          // singular targetRef instead of targetRefs array
          targetRef: {
            group: "gateway.networking.k8s.io",
            kind: "Gateway",
            name: "eg",
          },
        } as unknown as SecurityPolicy["spec"],
        status: undefined,
      };
      const result = buildNetworkingData({
        gateways: [],
        httpRoutes: [],
        policies: { securityPolicies: [singularRef] },
      });
      expect(result.policies).toHaveLength(1);
      const policy = result.policies[0];
      expect(policy.targetKind).toBe("Gateway");
      expect(policy.targetName).toBe("eg");
    });
  });

  describe("ingress mapping", () => {
    const ingressFixture: Ingress = {
      apiVersion: "networking.k8s.io/v1",
      kind: "Ingress",
      metadata: {
        name: "my-ingress",
        namespace: "default",
        creationTimestamp: "2026-01-01T00:00:00Z",
        uid: "aaa",
        resourceVersion: "1",
      },
      spec: {
        ingressClassName: "nginx",
        rules: [
          {
            host: "example.com",
            http: {
              paths: [
                {
                  path: "/api",
                  pathType: "Prefix",
                  backend: {
                    service: {
                      name: "my-svc",
                      port: { number: 80 },
                    },
                  },
                },
              ],
            },
          },
        ],
        tls: [{ hosts: ["example.com"], secretName: "my-tls" }],
      },
    } as unknown as Ingress;

    it("maps ingress fields", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [], ingresses: [ingressFixture] });
      expect(result.ingresses).toHaveLength(1);
      const ing = result.ingresses[0];
      expect(ing.name).toBe("my-ingress");
      expect(ing.ingressClassName).toBe("nginx");
      expect(ing.rules).toHaveLength(1);
      expect(ing.rules[0].host).toBe("example.com");
      expect(ing.rules[0].path).toBe("/api");
      expect(ing.rules[0].backendName).toBe("my-svc");
      expect(ing.rules[0].backendPort).toBe(80);
      expect(ing.rules[0].tls).toBe("my-tls");
    });
  });

  describe("HTTPRoute filters — live fixture (httproute-filtered.json)", () => {
    it("maps RequestHeaderModifier filter with correct summary", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [httpRouteFilteredFixture] });
      const rule = result.httpRoutes[0].rules[0];
      expect(rule.filters).toBeDefined();
      const reqHeader = rule.filters?.find((f) => f.type === "RequestHeaderModifier");
      expect(reqHeader).toBeDefined();
      expect(reqHeader?.summary).toBe("Req headers: +X-KRCI-Demo, -X-Internal");
    });

    it("maps URLRewrite filter with correct summary", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [httpRouteFilteredFixture] });
      const rule = result.httpRoutes[0].rules[0];
      const urlRewrite = rule.filters?.find((f) => f.type === "URLRewrite");
      expect(urlRewrite).toBeDefined();
      expect(urlRewrite?.summary).toBe("Rewrite prefix -> /");
    });

    it("preserves filter list order (RequestHeaderModifier before URLRewrite)", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [httpRouteFilteredFixture] });
      const filters = result.httpRoutes[0].rules[0].filters ?? [];
      expect(filters).toHaveLength(2);
      expect(filters[0].type).toBe("RequestHeaderModifier");
      expect(filters[1].type).toBe("URLRewrite");
    });
  });

  describe("HTTPRoute filters — defensive / unknown inputs", () => {
    const makeRouteWithFilters = (rawFilters: unknown[]): HTTPRoute => ({
      ...httpRouteFixture,
      spec: {
        hostnames: ["test.example.com"],
        parentRefs: [{ name: "eg" }],
        rules: [
          {
            backendRefs: [{ name: "svc", port: 80, weight: 1 }],
            filters: rawFilters,
            matches: [{ path: { type: "PathPrefix", value: "/" } }],
          },
        ],
      } as unknown as HTTPRoute["spec"],
    });

    it("does NOT throw for {type:'URLRewrite'} with no urlRewrite field", () => {
      const route = makeRouteWithFilters([{ type: "URLRewrite" }]);
      expect(() => buildNetworkingData({ gateways: [], httpRoutes: [route] })).not.toThrow();
      const filter = buildNetworkingData({ gateways: [], httpRoutes: [route] }).httpRoutes[0].rules[0].filters?.[0];
      expect(filter?.type).toBe("URLRewrite");
      expect(filter?.summary).toBe("Rewrite: (no config)");
    });

    it("does NOT throw for {type:'Unknown'} and yields safe summary", () => {
      const route = makeRouteWithFilters([{ type: "Unknown" }]);
      expect(() => buildNetworkingData({ gateways: [], httpRoutes: [route] })).not.toThrow();
      const filter = buildNetworkingData({ gateways: [], httpRoutes: [route] }).httpRoutes[0].rules[0].filters?.[0];
      expect(filter?.type).toBe("Unknown");
      expect(filter?.summary).toBe("Filter: Unknown");
    });

    it("does NOT throw for {type:'RequestHeaderModifier', requestHeaderModifier:{}} and yields safe summary", () => {
      const route = makeRouteWithFilters([{ type: "RequestHeaderModifier", requestHeaderModifier: {} }]);
      expect(() => buildNetworkingData({ gateways: [], httpRoutes: [route] })).not.toThrow();
      const filter = buildNetworkingData({ gateways: [], httpRoutes: [route] }).httpRoutes[0].rules[0].filters?.[0];
      expect(filter?.type).toBe("RequestHeaderModifier");
      expect(filter?.summary).toBe("Req headers: (empty)");
    });

    it("handles all three defensive cases in one rule without throwing", () => {
      const route = makeRouteWithFilters([
        { type: "URLRewrite" },
        { type: "Unknown" },
        { type: "RequestHeaderModifier", requestHeaderModifier: {} },
      ]);
      let result: ReturnType<typeof buildNetworkingData> | undefined;
      expect(() => {
        result = buildNetworkingData({ gateways: [], httpRoutes: [route] });
      }).not.toThrow();
      const filters = result!.httpRoutes[0].rules[0].filters ?? [];
      expect(filters).toHaveLength(3);
      expect(filters[0].summary).toBe("Rewrite: (no config)");
      expect(filters[1].summary).toBe("Filter: Unknown");
      expect(filters[2].summary).toBe("Req headers: (empty)");
    });

    it("produces no filters field when rule has no filters array", () => {
      const result = buildNetworkingData({ gateways: [], httpRoutes: [httpRouteFixture] });
      expect(result.httpRoutes[0].rules[0].filters).toBeUndefined();
    });
  });

  describe("full live fixture integration", () => {
    it("gateway eg addresses include NodePort 32317 when envoyServices supplied", () => {
      const result = buildNetworkingData({
        gateways: [gatewayFixture],
        httpRoutes: [httpRouteFixture],
        services: [serviceFixture],
        pods: [podFixture],
        policies: { securityPolicies: [securityPolicyFixture] },
        envoyServices: [envoyServiceFixture],
      });

      const gw = result.gateways[0];
      expect(gw.name).toBe("eg");
      const nodePort = gw.addresses.find((a) => a.type === "NodePort");
      expect(nodePort?.value).toBe("32317");
    });

    it("podsByService test-go-app has 1 ready Running pod", () => {
      const result = buildNetworkingData({
        gateways: [gatewayFixture],
        httpRoutes: [httpRouteFixture],
        services: [serviceFixture],
        pods: [podFixture],
        policies: { securityPolicies: [securityPolicyFixture] },
        envoyServices: [envoyServiceFixture],
      });

      const pods = result.podsByService?.["test-go-app"];
      expect(pods).toHaveLength(1);
      expect(pods![0].ready).toBe(true);
      expect(pods![0].status).toBe("Running");
    });

    it("policies has 1 SecurityPolicy test-go-app-cors targeting HTTPRoute test-go-app with Accepted=True and cors summary", () => {
      const result = buildNetworkingData({
        gateways: [gatewayFixture],
        httpRoutes: [httpRouteFixture],
        services: [serviceFixture],
        pods: [podFixture],
        policies: { securityPolicies: [securityPolicyFixture] },
        envoyServices: [envoyServiceFixture],
      });

      expect(result.policies).toHaveLength(1);
      const policy = result.policies[0];
      expect(policy.name).toBe("test-go-app-cors");
      expect(policy.kind).toBe("SecurityPolicy");
      expect(policy.targetKind).toBe("HTTPRoute");
      expect(policy.targetName).toBe("test-go-app");
      expect(policy.ancestorConditions[0].type).toBe("Accepted");
      expect(policy.ancestorConditions[0].status).toBe("True");
      expect(policy.configSummary).toContain("cors");
    });
  });
});
