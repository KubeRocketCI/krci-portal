import type {
  BackendTrafficPolicy,
  ClientTrafficPolicy,
  Gateway,
  HTTPRoute,
  Ingress,
  Pod,
  SecurityPolicy,
  Service,
} from "@my-project/shared";
import type {
  NetCondition,
  NetGateway,
  NetHTTPRoute,
  NetIngress,
  NetIngressRule,
  NetListener,
  NetPod,
  NetPolicy,
  NetRouteFilter,
  NetRoutingRule,
  NetworkingData,
} from "../types";

/** Cast gateway spec to any to access passthrough fields safely. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

function toCondition(raw: AnyRecord): NetCondition {
  return {
    type: raw["type"] ?? "",
    status: raw["status"] ?? "Unknown",
    reason: raw["reason"],
    message: raw["message"],
    observedGeneration: raw["observedGeneration"],
  };
}

export function mapGateway(gw: Gateway, envoyServices: Service[]): NetGateway {
  const spec = (gw.spec ?? {}) as AnyRecord;
  const status = (gw.status ?? {}) as AnyRecord;

  const specListeners: AnyRecord[] = Array.isArray(spec["listeners"]) ? spec["listeners"] : [];
  const statusListeners: AnyRecord[] = Array.isArray(status["listeners"]) ? status["listeners"] : [];

  // Build a map of status listeners by name for O(1) merge.
  const statusListenerByName = new Map<string, AnyRecord>();
  for (const sl of statusListeners) {
    statusListenerByName.set(sl["name"] as string, sl);
  }

  const listeners: NetListener[] = specListeners.map((sl): NetListener => {
    const name = sl["name"] ?? "";
    const statusL = statusListenerByName.get(name) ?? {};
    const rawConds: AnyRecord[] = Array.isArray(statusL["conditions"]) ? statusL["conditions"] : [];

    // TLS secret from spec.listeners[].tls.certificateRefs[0].name
    const tlsSecret: string | undefined = sl["tls"]?.["certificateRefs"]?.[0]?.["name"];

    return {
      name,
      protocol: sl["protocol"] ?? "",
      port: sl["port"] ?? 0,
      hostname: sl["hostname"],
      tlsSecret,
      attachedRoutes: statusL["attachedRoutes"] ?? 0,
      conditions: rawConds.map(toCondition),
    };
  });

  const rawConditions: AnyRecord[] = Array.isArray(status["conditions"]) ? status["conditions"] : [];
  const rawAddresses: AnyRecord[] = Array.isArray(status["addresses"]) ? status["addresses"] : [];

  // Resolve addresses: prefer status.addresses; fall back to envoy data-plane Service.
  let addresses: Array<{ type: string; value: string }>;

  if (rawAddresses.length > 0) {
    addresses = rawAddresses.map((a) => ({ type: a["type"] ?? "", value: a["value"] ?? "" }));
  } else {
    // Find the envoy Service whose labels declare ownership of this Gateway.
    const gwName = gw.metadata.name ?? "";
    const gwNamespace = gw.metadata.namespace ?? "";
    const envoyService = envoyServices.find((svc) => {
      const labels = (svc.metadata.labels ?? {}) as AnyRecord;
      return (
        labels["gateway.envoyproxy.io/owning-gateway-name"] === gwName &&
        labels["gateway.envoyproxy.io/owning-gateway-namespace"] === gwNamespace
      );
    });

    addresses = [];
    if (envoyService) {
      const svcSpec = (envoyService.spec ?? {}) as AnyRecord;
      const ports: AnyRecord[] = Array.isArray(svcSpec["ports"]) ? svcSpec["ports"] : [];
      for (const p of ports) {
        if (p["nodePort"] != null) {
          addresses.push({ type: "NodePort", value: String(p["nodePort"]) });
        }
      }
      if (svcSpec["clusterIP"] && svcSpec["clusterIP"] !== "None") {
        addresses.push({ type: "ClusterIP", value: svcSpec["clusterIP"] as string });
      }
    }
  }

  return {
    name: gw.metadata.name ?? "",
    namespace: gw.metadata.namespace ?? "",
    generation: gw.metadata.generation ?? 0,
    gatewayClassName: spec["gatewayClassName"] ?? "",
    conditions: rawConditions.map(toCondition),
    listeners,
    addresses,
  };
}

/** Build a compact human-readable summary for a single HTTPRoute rule filter. */
function summarizeFilter(filter: AnyRecord): NetRouteFilter {
  const type: string = typeof filter["type"] === "string" ? filter["type"] : "Unknown";

  try {
    switch (type) {
      case "RequestHeaderModifier": {
        const cfg = filter["requestHeaderModifier"] as AnyRecord | null | undefined;
        if (cfg == null) return { type, summary: "Req headers: (no config)" };
        const parts: string[] = [];
        const sets: AnyRecord[] = Array.isArray(cfg["set"]) ? cfg["set"] : [];
        const adds: AnyRecord[] = Array.isArray(cfg["add"]) ? cfg["add"] : [];
        const removes: string[] = Array.isArray(cfg["remove"]) ? cfg["remove"] : [];
        for (const h of sets) parts.push(`=${h["name"] ?? "?"}`);
        for (const h of adds) parts.push(`+${h["name"] ?? "?"}`);
        for (const h of removes) parts.push(`-${String(h)}`);
        return { type, summary: parts.length > 0 ? `Req headers: ${parts.join(", ")}` : "Req headers: (empty)" };
      }

      case "ResponseHeaderModifier": {
        const cfg = filter["responseHeaderModifier"] as AnyRecord | null | undefined;
        if (cfg == null) return { type, summary: "Resp headers: (no config)" };
        const parts: string[] = [];
        const sets: AnyRecord[] = Array.isArray(cfg["set"]) ? cfg["set"] : [];
        const adds: AnyRecord[] = Array.isArray(cfg["add"]) ? cfg["add"] : [];
        const removes: string[] = Array.isArray(cfg["remove"]) ? cfg["remove"] : [];
        for (const h of sets) parts.push(`=${h["name"] ?? "?"}`);
        for (const h of adds) parts.push(`+${h["name"] ?? "?"}`);
        for (const h of removes) parts.push(`-${String(h)}`);
        return { type, summary: parts.length > 0 ? `Resp headers: ${parts.join(", ")}` : "Resp headers: (empty)" };
      }

      case "RequestRedirect": {
        const cfg = filter["requestRedirect"] as AnyRecord | null | undefined;
        if (cfg == null) return { type, summary: "Redirect: (no config)" };
        const scheme: string | undefined = typeof cfg["scheme"] === "string" ? cfg["scheme"] : undefined;
        const hostname: string | undefined = typeof cfg["hostname"] === "string" ? cfg["hostname"] : undefined;
        const port: number | undefined = typeof cfg["port"] === "number" ? cfg["port"] : undefined;
        const statusCode: number = typeof cfg["statusCode"] === "number" ? cfg["statusCode"] : 302;
        const pathMod = cfg["path"] as AnyRecord | null | undefined;
        let pathStr = "";
        if (pathMod != null && typeof pathMod["type"] === "string") {
          if (pathMod["type"] === "ReplaceFullPath" && typeof pathMod["replaceFullPath"] === "string") {
            pathStr = pathMod["replaceFullPath"];
          } else if (pathMod["type"] === "ReplacePrefixMatch" && typeof pathMod["replacePrefixMatch"] === "string") {
            pathStr = pathMod["replacePrefixMatch"] + "...";
          }
        }
        const target =
          (scheme ? `${scheme}://` : "") + (hostname ?? "<orig-host>") + (port != null ? `:${port}` : "") + pathStr;
        return { type, summary: `Redirect -> ${target} (${statusCode})` };
      }

      case "URLRewrite": {
        const cfg = filter["urlRewrite"] as AnyRecord | null | undefined;
        if (cfg == null) return { type, summary: "Rewrite: (no config)" };
        const hostname: string | undefined = typeof cfg["hostname"] === "string" ? cfg["hostname"] : undefined;
        const pathMod = cfg["path"] as AnyRecord | null | undefined;
        let pathPart: string | undefined;
        if (pathMod != null && typeof pathMod["type"] === "string") {
          if (pathMod["type"] === "ReplaceFullPath" && typeof pathMod["replaceFullPath"] === "string") {
            pathPart = `path -> ${pathMod["replaceFullPath"]}`;
          } else if (pathMod["type"] === "ReplacePrefixMatch" && typeof pathMod["replacePrefixMatch"] === "string") {
            pathPart = `prefix -> ${pathMod["replacePrefixMatch"]}`;
          }
        }
        if (hostname && pathPart) return { type, summary: `Rewrite host -> ${hostname}, ${pathPart}` };
        if (pathPart) return { type, summary: `Rewrite ${pathPart}` };
        if (hostname) return { type, summary: `Rewrite host -> ${hostname}` };
        return { type, summary: "Rewrite: (empty)" };
      }

      case "RequestMirror": {
        const cfg = filter["requestMirror"] as AnyRecord | null | undefined;
        if (cfg == null) return { type, summary: "Mirror: (no config)" };
        const backendRef = cfg["backendRef"] as AnyRecord | null | undefined;
        if (backendRef == null) return { type, summary: "Mirror -> (unknown)" };
        const name: string = typeof backendRef["name"] === "string" ? backendRef["name"] : "(unknown)";
        const ns: string | undefined =
          typeof backendRef["namespace"] === "string" ? backendRef["namespace"] : undefined;
        const port: number | undefined = typeof backendRef["port"] === "number" ? backendRef["port"] : undefined;
        const nameStr = ns ? `${ns}/${name}` : name;
        const portStr = port != null ? `:${port}` : "";
        const percent: number | undefined = typeof cfg["percent"] === "number" ? cfg["percent"] : undefined;
        const fraction = cfg["fraction"] as AnyRecord | null | undefined;
        let rateStr = "";
        if (percent != null) rateStr = ` (${percent}%)`;
        else if (fraction != null && typeof fraction["numerator"] === "number") {
          const denom: number = typeof fraction["denominator"] === "number" ? fraction["denominator"] : 100;
          rateStr = ` (${fraction["numerator"]}/${denom})`;
        }
        return { type, summary: `Mirror -> ${nameStr}${portStr}${rateStr}` };
      }

      case "ExtensionRef": {
        const cfg = filter["extensionRef"] as AnyRecord | null | undefined;
        if (cfg == null) return { type, summary: "ExtensionRef: (no config)" };
        const group: string = typeof cfg["group"] === "string" ? cfg["group"] : "";
        const kind: string = typeof cfg["kind"] === "string" ? cfg["kind"] : "?";
        const name: string = typeof cfg["name"] === "string" ? cfg["name"] : "?";
        const groupStr = group === "" ? "core" : group;
        return { type, summary: `ExtensionRef: ${kind}/${name} (${groupStr})` };
      }

      case "CORS": {
        return { type, summary: "CORS: (see cors config)" };
      }

      default: {
        return { type, summary: `Filter: ${type}` };
      }
    }
  } catch {
    // Safety net: never crash the page
    return { type, summary: `Filter: ${type}` };
  }
}

export function mapHTTPRoute(route: HTTPRoute): NetHTTPRoute {
  const spec = (route.spec ?? {}) as AnyRecord;
  const status = (route.status ?? {}) as AnyRecord;

  const routeHostnames: string[] = Array.isArray(spec["hostnames"]) ? spec["hostnames"] : [];

  const specParentRefs: AnyRecord[] = Array.isArray(spec["parentRefs"]) ? spec["parentRefs"] : [];
  const parentRefs = specParentRefs.map((pr) => ({
    name: pr["name"] ?? "",
    namespace: pr["namespace"] as string | undefined,
    sectionName: pr["sectionName"] as string | undefined,
  }));

  const specRules: AnyRecord[] = Array.isArray(spec["rules"]) ? spec["rules"] : [];
  const rules: NetRoutingRule[] = [];
  specRules.forEach((rule, ruleIndex) => {
    const matches: AnyRecord[] = Array.isArray(rule["matches"]) ? rule["matches"] : [];
    const firstMatch = matches[0] ?? {};
    const pathType: string | undefined = firstMatch["path"]?.["type"];
    const pathValue: string | undefined = firstMatch["path"]?.["value"];

    const rawFilters: AnyRecord[] = Array.isArray(rule["filters"]) ? rule["filters"] : [];
    const filters: NetRouteFilter[] = rawFilters.map((f) => summarizeFilter(f as AnyRecord));

    const backendRefs: AnyRecord[] = Array.isArray(rule["backendRefs"]) ? rule["backendRefs"] : [];
    // Gateway API backendRef weights are relative (default 1). Normalize to a
    // percentage of the rule's total so a sole backend reads 100% (not 1%).
    const totalWeight = backendRefs.reduce((sum, b) => sum + (typeof b["weight"] === "number" ? b["weight"] : 1), 0);
    // showWeight: spec-based flag — true only when this rule genuinely splits
    // traffic across ≥2 backends (canary). Used by card/overview views to suppress
    // the misleading "100%" label for single-backend rules.
    // NOTE: the topology (useTopologyGraphData) computes showWeight INDEPENDENTLY
    // from app-scope-filtered sibling counts so that a canary whose partner is
    // filtered out by appName scope still hides the label correctly. This
    // spec-based flag is for the non-app-scoped card/overview views only.
    const showWeight = backendRefs.length > 1;
    if (backendRefs.length === 0) {
      // Backend-less rule (e.g. a RequestRedirect) — keep it so its filters are
      // still surfaced. Empty backendName signals "no backend" to the topology.
      rules.push({
        hostnames: routeHostnames,
        pathType,
        pathValue,
        backendName: "",
        backendPort: 0,
        weight: undefined,
        showWeight: false,
        filters: filters.length > 0 ? filters : undefined,
        ruleIndex,
      });
    } else {
      for (const backend of backendRefs) {
        const w = typeof backend["weight"] === "number" ? backend["weight"] : 1;
        rules.push({
          // Gateway API has no per-rule hostnames; copy route-level hostnames here.
          hostnames: routeHostnames,
          pathType,
          pathValue,
          backendName: backend["name"] ?? "",
          backendPort: backend["port"] ?? 0,
          weight: totalWeight > 0 ? Math.round((w / totalWeight) * 100) : undefined,
          showWeight,
          filters: filters.length > 0 ? filters : undefined,
          // All backendRefs within the same spec rule share the same ruleIndex —
          // canary splits (multiple backends in one rule) all join the same
          // per-rule Envoy metric before weight apportioning.
          ruleIndex,
        });
      }
    }
  });

  const statusParents: AnyRecord[] = Array.isArray(status["parents"]) ? status["parents"] : [];
  const parentConditions = statusParents.map((p) => {
    const rawConds: AnyRecord[] = Array.isArray(p["conditions"]) ? p["conditions"] : [];
    return {
      parentName: p["parentRef"]?.["name"] ?? "",
      conditions: rawConds.map(toCondition),
    };
  });

  return {
    name: route.metadata.name ?? "",
    namespace: route.metadata.namespace ?? "",
    generation: route.metadata.generation ?? 0,
    hostnames: routeHostnames,
    parentRefs,
    rules,
    parentConditions,
  };
}

function mapIngress(ingress: Ingress): NetIngress {
  const spec = (ingress.spec ?? {}) as AnyRecord;
  const specRules: AnyRecord[] = Array.isArray(spec["rules"]) ? spec["rules"] : [];
  const tlsEntries: AnyRecord[] = Array.isArray(spec["tls"]) ? spec["tls"] : [];

  // Build a host→tls secret map for quick lookup.
  const tlsByHost = new Map<string, string>();
  for (const tlsEntry of tlsEntries) {
    const tlsHosts: string[] = Array.isArray(tlsEntry["hosts"]) ? tlsEntry["hosts"] : [];
    const secret: string | undefined = tlsEntry["secretName"];
    for (const h of tlsHosts) {
      if (secret) tlsByHost.set(h, secret);
    }
  }

  const rules: NetIngressRule[] = specRules.map((r): NetIngressRule => {
    const host: string | undefined = r["host"];
    const paths: AnyRecord[] = Array.isArray(r["http"]?.["paths"]) ? r["http"]["paths"] : [];
    const firstPath = paths[0] ?? {};
    const path: string | undefined = firstPath["path"];
    const backendSvc = firstPath["backend"]?.["service"];
    const backendName: string | undefined = backendSvc?.["name"];
    const backendPort: number | undefined = backendSvc?.["port"]?.["number"] ?? backendSvc?.["port"]?.["name"];

    return {
      host,
      path,
      backendName,
      backendPort: typeof backendPort === "number" ? backendPort : undefined,
      tls: host ? tlsByHost.get(host) : undefined,
    };
  });

  return {
    name: ingress.metadata.name ?? "",
    namespace: ingress.metadata.namespace ?? "",
    ingressClassName: spec["ingressClassName"] as string | undefined,
    rules,
  };
}

function securityPolicySummary(spec: AnyRecord): string {
  const features = ["cors", "jwt", "oidc", "basicAuth", "extAuth", "apiKeyAuth", "authorization"];
  const active = features.filter((f) => spec[f] != null);
  return active.length > 0 ? active.join(", ") : "";
}

function backendTrafficPolicySummary(spec: AnyRecord): string {
  const features = [
    "rateLimit",
    "circuitBreaker",
    "retry",
    "loadBalancer",
    "timeout",
    "healthCheck",
    "connection",
    "faultInjection",
  ];
  const active = features.filter((f) => spec[f] != null);
  return active.length > 0 ? active.join(", ") : "";
}

function clientTrafficPolicySummary(spec: AnyRecord): string {
  const features = ["timeout", "tls", "connection", "headers", "http1", "http2", "http3"];
  const active = features.filter((f) => spec[f] != null);
  return active.length > 0 ? active.join(", ") : "";
}

function mapPolicy(
  resource: SecurityPolicy | BackendTrafficPolicy | ClientTrafficPolicy,
  kind: "SecurityPolicy" | "BackendTrafficPolicy" | "ClientTrafficPolicy",
  summarize: (spec: AnyRecord) => string
): NetPolicy {
  const spec = (resource.spec ?? {}) as AnyRecord;
  const status = (resource.status ?? {}) as AnyRecord;

  const targetRefs: AnyRecord[] = Array.isArray(spec["targetRefs"]) ? spec["targetRefs"] : [];
  const firstRef = targetRefs[0] ?? (spec["targetRef"] as AnyRecord | undefined) ?? {};
  const targetKind = (firstRef["kind"] as string) === "Gateway" ? "Gateway" : "HTTPRoute";
  const targetName: string = firstRef["name"] ?? "";

  const ancestors: AnyRecord[] = Array.isArray(status["ancestors"]) ? status["ancestors"] : [];
  const ancestorConditions: NetCondition[] = ancestors.flatMap((a) => {
    const rawConds: AnyRecord[] = Array.isArray(a["conditions"]) ? a["conditions"] : [];
    return rawConds.map(toCondition);
  });

  const summary = summarize(spec);

  return {
    name: resource.metadata.name ?? "",
    namespace: resource.metadata.namespace ?? "",
    kind,
    targetKind: targetKind as "Gateway" | "HTTPRoute",
    targetName,
    ancestorConditions,
    configSummary: summary || undefined,
  };
}

/** Map any of the three policy kinds to a {@link NetPolicy} using the appropriate summarizer. */
export function mapPolicyByKind(resource: SecurityPolicy | BackendTrafficPolicy | ClientTrafficPolicy): NetPolicy {
  switch (resource.kind) {
    case "SecurityPolicy":
      return mapPolicy(resource, "SecurityPolicy", securityPolicySummary);
    case "BackendTrafficPolicy":
      return mapPolicy(resource, "BackendTrafficPolicy", backendTrafficPolicySummary);
    default:
      return mapPolicy(resource, "ClientTrafficPolicy", clientTrafficPolicySummary);
  }
}

function podStatusLabel(pod: Pod): NetPod["status"] {
  const status = (pod.status ?? {}) as AnyRecord;
  const containerStatuses: AnyRecord[] = Array.isArray(status["containerStatuses"]) ? status["containerStatuses"] : [];

  // First check for a waiting container — surface its reason (e.g. CrashLoopBackOff).
  for (const cs of containerStatuses) {
    const waitingReason: string | undefined = cs["state"]?.["waiting"]?.["reason"];
    if (waitingReason) {
      // Map known reason strings to the union; fall back to "Error".
      const knownReasons: NetPod["status"][] = [
        "Running",
        "Pending",
        "ContainerCreating",
        "CrashLoopBackOff",
        "Error",
        "Terminating",
      ];
      return knownReasons.includes(waitingReason as NetPod["status"]) ? (waitingReason as NetPod["status"]) : "Error";
    }
  }

  const phase: string | undefined = status["phase"];
  const knownPhases: NetPod["status"][] = ["Running", "Pending", "Terminating"];
  if (phase && knownPhases.includes(phase as NetPod["status"])) {
    return phase as NetPod["status"];
  }
  return "Error";
}

function mapPod(pod: Pod): NetPod {
  const status = (pod.status ?? {}) as AnyRecord;
  const containerStatuses: AnyRecord[] = Array.isArray(status["containerStatuses"]) ? status["containerStatuses"] : [];

  const ready = containerStatuses.length > 0 && containerStatuses.every((cs) => cs["ready"] === true);
  const restarts = containerStatuses.reduce((sum: number, cs) => sum + ((cs["restartCount"] as number) ?? 0), 0);

  return {
    name: pod.metadata.name ?? "",
    status: podStatusLabel(pod),
    ready,
    restarts,
  };
}

/** Collect all backend Service names referenced by HTTPRoutes and Ingresses. */
function collectBackendServiceNames(httpRoutes: HTTPRoute[], ingresses: Ingress[]): Set<string> {
  const names = new Set<string>();

  for (const route of httpRoutes) {
    const spec = (route.spec ?? {}) as AnyRecord;
    const rules: AnyRecord[] = Array.isArray(spec["rules"]) ? spec["rules"] : [];
    for (const rule of rules) {
      const backends: AnyRecord[] = Array.isArray(rule["backendRefs"]) ? rule["backendRefs"] : [];
      for (const b of backends) {
        if (b["name"]) names.add(b["name"] as string);
      }
    }
  }

  for (const ingress of ingresses) {
    const spec = (ingress.spec ?? {}) as AnyRecord;
    const rules: AnyRecord[] = Array.isArray(spec["rules"]) ? spec["rules"] : [];
    for (const r of rules) {
      const paths: AnyRecord[] = Array.isArray(r["http"]?.["paths"]) ? r["http"]["paths"] : [];
      for (const p of paths) {
        const svcName: string | undefined = p["backend"]?.["service"]?.["name"];
        if (svcName) names.add(svcName);
      }
    }
  }

  return names;
}

export interface BuildNetworkingDataInput {
  gateways: Gateway[];
  httpRoutes: HTTPRoute[];
  services?: Service[];
  pods?: Pod[];
  ingresses?: Ingress[];
  policies?: {
    securityPolicies?: SecurityPolicy[];
    backendTrafficPolicies?: BackendTrafficPolicy[];
    clientTrafficPolicies?: ClientTrafficPolicy[];
  };
  /** Services from envoy-gateway-system namespace — used to resolve Gateway addresses. */
  envoyServices?: Service[];
}

export function buildNetworkingData(input: BuildNetworkingDataInput): NetworkingData {
  const { gateways, httpRoutes, services = [], pods = [], ingresses = [], policies = {}, envoyServices = [] } = input;

  const mappedGateways = gateways.map((gw) => mapGateway(gw, envoyServices));
  const mappedRoutes = httpRoutes.map(mapHTTPRoute);
  const mappedIngresses = ingresses.map(mapIngress);
  const mappedPolicies: NetPolicy[] = [
    ...(policies.securityPolicies ?? []).map((p) => mapPolicy(p, "SecurityPolicy", securityPolicySummary)),
    ...(policies.backendTrafficPolicies ?? []).map((p) =>
      mapPolicy(p, "BackendTrafficPolicy", backendTrafficPolicySummary)
    ),
    ...(policies.clientTrafficPolicies ?? []).map((p) =>
      mapPolicy(p, "ClientTrafficPolicy", clientTrafficPolicySummary)
    ),
  ];

  const backendNames = collectBackendServiceNames(httpRoutes, ingresses);
  const podsByService: Record<string, NetPod[]> = {};

  for (const svcName of backendNames) {
    const svc = services.find((s) => s.metadata.name === svcName);
    const selector = (svc?.spec as AnyRecord | undefined)?.["selector"] as Record<string, string> | undefined;

    if (!selector || Object.keys(selector).length === 0) {
      podsByService[svcName] = [];
      continue;
    }

    const matchingPods = pods.filter((pod) => {
      const podLabels = (pod.metadata.labels ?? {}) as Record<string, string>;
      return Object.entries(selector).every(([k, v]) => podLabels[k] === v);
    });

    podsByService[svcName] = matchingPods.map(mapPod);
  }

  return {
    gateways: mappedGateways,
    httpRoutes: mappedRoutes,
    ingresses: mappedIngresses,
    policies: mappedPolicies,
    podsByService,
  };
}
