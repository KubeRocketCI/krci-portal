// Realistic mock fixtures built from harvested samples:
//   .design-harvest/samples/{gateway,httproute,securitypolicy,backendtrafficpolicy,clienttrafficpolicy}.yaml
// All exports are NetworkingData bundles for Storybook stories.

import type { NetGateway, NetHTTPRoute, NetIngress, NetPolicy, NetworkingData } from "./types";

// Real sample from gateway.yaml: Accepted=True, Programmed=False/AddressNotAssigned, http:80.
// Enriched with an invented HTTPS:443 listener for a richer demo.
const gatewayEg: NetGateway = {
  name: "eg",
  namespace: "eg-demo",
  generation: 1,
  gatewayClassName: "eg",
  conditions: [
    {
      type: "Accepted",
      status: "True",
      reason: "Accepted",
      message: "The Gateway has been scheduled by Envoy Gateway",
      observedGeneration: 1,
    },
    {
      type: "Programmed",
      status: "False",
      reason: "AddressNotAssigned",
      message: "No addresses have been assigned to the Gateway",
      observedGeneration: 1,
    },
  ],
  listeners: [
    {
      name: "http",
      protocol: "HTTP",
      port: 80,
      hostname: undefined,
      tlsCertificateRef: undefined,
      attachedRoutes: 1,
      conditions: [
        { type: "Accepted", status: "True", reason: "Accepted", observedGeneration: 1 },
        { type: "Programmed", status: "True", reason: "Programmed", observedGeneration: 1 },
        { type: "ResolvedRefs", status: "True", reason: "ResolvedRefs", observedGeneration: 1 },
      ],
    },
    {
      name: "https",
      protocol: "HTTPS",
      port: 443,
      hostname: "*.example.com",
      tlsCertificateRef: { name: "example-tls" },
      attachedRoutes: 1,
      conditions: [
        { type: "Accepted", status: "True", reason: "Accepted", observedGeneration: 1 },
        { type: "Programmed", status: "True", reason: "Programmed", observedGeneration: 1 },
        { type: "ResolvedRefs", status: "True", reason: "ResolvedRefs", observedGeneration: 1 },
      ],
    },
  ],
  addresses: [],
};

// Real sample from httproute.yaml: hostnames=[www.example.com], parentRefs=[eg], Accepted=True, ResolvedRefs=True.
const routeBackend: NetHTTPRoute = {
  name: "backend",
  namespace: "eg-demo",
  generation: 1,
  hostnames: ["www.example.com"],
  parentRefs: [{ name: "eg" }],
  rules: [
    {
      hostnames: ["www.example.com"],
      pathType: "PathPrefix",
      pathValue: "/",
      backendName: "backend",
      backendPort: 3000,
      weight: 100,
      ruleIndex: 0,
      filters: [
        { type: "RequestHeaderModifier", summary: "Req headers: +X-KRCI-Demo, -X-Internal" },
        { type: "URLRewrite", summary: "Rewrite prefix -> /" },
      ],
    },
  ],
  parentConditions: [
    {
      parentName: "eg",
      conditions: [
        {
          type: "Accepted",
          status: "True",
          reason: "Accepted",
          message: "Route is accepted",
          observedGeneration: 1,
        },
        {
          type: "ResolvedRefs",
          status: "True",
          reason: "ResolvedRefs",
          message: "Resolved all the Object references for the Route",
          observedGeneration: 1,
        },
      ],
    },
  ],
};

// Invented canary route with ResolvedRefs=False / BackendNotFound to exercise the error path.
const routeCanary: NetHTTPRoute = {
  name: "canary-route",
  namespace: "eg-demo",
  generation: 2,
  hostnames: ["www.example.com"],
  parentRefs: [{ name: "eg" }],
  rules: [
    {
      hostnames: ["www.example.com"],
      pathType: "PathPrefix",
      pathValue: "/",
      backendName: "svc-stable",
      backendPort: 8080,
      weight: 90,
      ruleIndex: 0,
      filters: [{ type: "RequestRedirect", summary: "Redirect -> https://<orig-host> (301)" }],
    },
    {
      hostnames: ["www.example.com"],
      pathType: "PathPrefix",
      pathValue: "/",
      backendName: "canary-svc",
      backendPort: 8080,
      weight: 10,
      ruleIndex: 0,
    },
  ],
  parentConditions: [
    {
      parentName: "eg",
      conditions: [
        {
          type: "Accepted",
          status: "True",
          reason: "Accepted",
          message: "Route is accepted",
          observedGeneration: 2,
        },
        {
          type: "ResolvedRefs",
          status: "False",
          reason: "BackendNotFound",
          message: 'Service "canary-svc" not found in namespace eg-demo',
          observedGeneration: 2,
        },
      ],
    },
  ],
};

const ingressMyApp: NetIngress = {
  name: "my-app-ingress",
  namespace: "eg-demo",
  ingressClassName: "nginx",
  rules: [
    { host: "www.example.com", path: "/", backendName: "backend", backendPort: 3000, tls: undefined },
    { host: "www.example.com", path: "/api", backendName: "api-svc", backendPort: 3001, tls: undefined },
  ],
};

// Real sample from securitypolicy.yaml.
const policyCors: NetPolicy = {
  name: "cors-demo",
  namespace: "eg-demo",
  kind: "SecurityPolicy",
  targetKind: "HTTPRoute",
  targetName: "backend",
  ancestorConditions: [
    {
      type: "Accepted",
      status: "True",
      reason: "Accepted",
      message: "Policy has been accepted.",
      observedGeneration: 1,
    },
  ],
  configSummary: "CORS: allowOrigins: [https://example.com], allowMethods: GET, POST",
};

// Real sample from backendtrafficpolicy.yaml.
const policyRateLimit: NetPolicy = {
  name: "rl-demo",
  namespace: "eg-demo",
  kind: "BackendTrafficPolicy",
  targetKind: "Gateway",
  targetName: "eg",
  ancestorConditions: [
    {
      type: "Accepted",
      status: "True",
      reason: "Accepted",
      message: "Policy has been accepted.",
      observedGeneration: 1,
    },
  ],
  configSummary: "RateLimit: 100 req/Minute (Local)",
};

// Real sample from clienttrafficpolicy.yaml.
const policyCtp: NetPolicy = {
  name: "ctp-demo",
  namespace: "eg-demo",
  kind: "ClientTrafficPolicy",
  targetKind: "Gateway",
  targetName: "eg",
  ancestorConditions: [
    {
      type: "Accepted",
      status: "True",
      reason: "Accepted",
      message: "Policy has been accepted.",
      observedGeneration: 1,
    },
  ],
  configSummary: "Timeout: requestReceived=10s",
};

/** Healthy + degraded mixed state — the primary review scenario */
export const mockPopulated: NetworkingData = {
  gateways: [gatewayEg],
  httpRoutes: [routeBackend, routeCanary],
  ingresses: [ingressMyApp],
  policies: [policyCors, policyRateLimit, policyCtp],
  podsByService: {
    backend: [
      { name: "backend-7c9d4-abcde", status: "Running", ready: true },
      { name: "backend-7c9d4-fghij", status: "Running", ready: true },
      { name: "backend-7c9d4-klmno", status: "Running", ready: true, restarts: 2 },
    ],
    "svc-stable": [
      { name: "svc-stable-6b8f2-pqrst", status: "Running", ready: true },
      { name: "svc-stable-6b8f2-uvwxy", status: "Pending", ready: false },
    ],
    "api-svc": [{ name: "api-svc-5a7e1-zabcd", status: "Running", ready: true }],
  },
};

/** CRDs installed, nothing deployed in this namespace */
export const mockEmpty: NetworkingData = {
  gateways: [],
  httpRoutes: [],
  ingresses: [],
  policies: [],
};

/**
 * Sentinel for Gateway API CRDs not installed.
 * The index.tsx checks `state === "crd-absent"` and renders an Alert instead of sections.
 */
export const mockCRDAbsent: NetworkingData = mockEmpty;

/**
 * Sentinel for RBAC denied (403) on Gateway API watches.
 * The index.tsx checks `state === "rbac-denied"` and renders the appropriate Alert.
 */
export const mockRBACDenied: NetworkingData = mockEmpty;
