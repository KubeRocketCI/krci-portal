// Local loose types for the Networking tab — only the fields the UI renders.
// Real models live in @my-project/shared (future phase); these are draft-only.

export interface NetCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  reason?: string;
  message?: string;
  observedGeneration?: number;
}

export interface NetListener {
  name: string;
  protocol: string;
  port: number;
  hostname?: string;
  tlsCertificateRef?: { kind?: string; namespace?: string; name: string };
  attachedRoutes: number;
  conditions: NetCondition[];
}

export interface NetGateway {
  name: string;
  namespace: string;
  generation: number;
  gatewayClassName: string;
  conditions: NetCondition[];
  listeners: NetListener[];
  /** status.addresses — empty in kind/local clusters */
  addresses: Array<{ type: string; value: string }>;
}

export interface NetRouteFilter {
  type: string;
  summary: string;
}

export interface NetRoutingRule {
  hostnames: string[];
  pathType?: string;
  pathValue?: string;
  backendName: string;
  backendPort: number;
  weight?: number;
  /**
   * True only when the rule has a genuine multi-backend split (canary) — gates
   * the "%" label in card/overview views. False for sole-backend rules so a
   * misleading "100%" is never shown where there is no canary split.
   */
  showWeight?: boolean;
  filters?: NetRouteFilter[];
  /**
   * Zero-based index of the HTTPRoute spec.rules entry this backend was
   * flattened from. Used by the topology metric overlay to join each
   * route→backend edge to its own Envoy per-rule metric instead of the
   * (inflated) route-level aggregate.
   */
  ruleIndex: number;
}

export interface NetHTTPRoute {
  name: string;
  namespace: string;
  generation: number;
  hostnames: string[];
  parentRefs: Array<{ name: string; namespace?: string; sectionName?: string }>;
  rules: NetRoutingRule[];
  parentConditions: Array<{
    parentName: string;
    conditions: NetCondition[];
  }>;
}

export interface NetIngressRule {
  host?: string;
  path?: string;
  backendName?: string;
  backendPort?: number;
  tls?: string;
}

export interface NetIngress {
  name: string;
  namespace: string;
  ingressClassName?: string;
  rules: NetIngressRule[];
}

export interface NetPolicy {
  name: string;
  namespace: string;
  kind: "SecurityPolicy" | "BackendTrafficPolicy" | "ClientTrafficPolicy";
  targetKind: "Gateway" | "HTTPRoute";
  targetName: string;
  /** Only Accepted condition — policies do not have ResolvedRefs */
  ancestorConditions: NetCondition[];
  /** Human-readable summary of effective config */
  configSummary?: string;
}

export interface DerivedURL {
  url: string;
  healthy: boolean;
}

export interface NetPod {
  name: string;
  status: "Running" | "Pending" | "ContainerCreating" | "CrashLoopBackOff" | "Error" | "Terminating";
  ready: boolean;
  restarts?: number;
}

export interface NetworkingData {
  gateways: NetGateway[];
  httpRoutes: NetHTTPRoute[];
  ingresses: NetIngress[];
  policies: NetPolicy[];
  /** Pods behind each backend Service, keyed by Service name (for the topology pod lane). */
  podsByService?: Record<string, NetPod[]>;
}
