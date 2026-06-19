import { describe, it, expect } from "vitest";
import { backendTrafficPolicySchema } from "./schema.js";

const FIXTURE = {
  apiVersion: "gateway.envoyproxy.io/v1alpha1",
  kind: "BackendTrafficPolicy",
  metadata: {
    name: "rl-demo",
    namespace: "eg-demo",
    uid: "0679c655-5984-409e-8476-1016780dc29c",
    creationTimestamp: "2026-06-13T11:23:33Z",
  },
  spec: {
    rateLimit: {
      local: { rules: [{ limit: { requests: 100, unit: "Minute" } }] },
      type: "Local",
    },
    targetRefs: [{ group: "gateway.networking.k8s.io", kind: "Gateway", name: "eg" }],
  },
  status: {
    ancestors: [
      {
        ancestorRef: {
          group: "gateway.networking.k8s.io",
          kind: "Gateway",
          name: "eg",
          namespace: "eg-demo",
        },
        conditions: [{ reason: "Accepted", status: "True", type: "Accepted" }],
        controllerName: "gateway.envoyproxy.io/gatewayclass-controller",
      },
    ],
  },
};

describe("backendTrafficPolicySchema", () => {
  it("(a) minimal-valid: required metadata + kind + apiVersion + empty spec", () => {
    const obj = {
      apiVersion: "gateway.envoyproxy.io/v1alpha1",
      kind: "BackendTrafficPolicy",
      metadata: {
        name: "min-btp",
        uid: "aaaaaaaa-0000-0000-0000-000000000001",
        creationTimestamp: "2026-01-01T00:00:00Z",
      },
      spec: {},
    };
    expect(backendTrafficPolicySchema.safeParse(obj).success).toBe(true);
  });

  it("(b) partial/early: no status, no optional spec fields", () => {
    const obj = {
      apiVersion: "gateway.envoyproxy.io/v1alpha1",
      kind: "BackendTrafficPolicy",
      metadata: {
        name: "partial-btp",
        uid: "aaaaaaaa-0000-0000-0000-000000000002",
        creationTimestamp: "2026-01-01T00:00:00Z",
      },
      spec: {
        targetRefs: [{ group: "gateway.networking.k8s.io", kind: "HTTPRoute", name: "my-route" }],
      },
    };
    expect(backendTrafficPolicySchema.safeParse(obj).success).toBe(true);
  });

  it("(c) real-sample: fixture parses and UI-read fields are accessible", () => {
    const result = backendTrafficPolicySchema.safeParse(FIXTURE);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.spec?.targetRefs?.[0]?.kind).toBe("Gateway");
    expect(result.data.spec?.targetRefs?.[0]?.name).toBe("eg");
    expect(result.data.spec?.rateLimit).toBeDefined();
    expect(result.data.status?.ancestors?.[0]?.conditions?.[0]?.type).toBe("Accepted");
  });

  it("(d) forward-compat: unknown field in spec is preserved via passthrough", () => {
    const obj = { ...FIXTURE, spec: { ...FIXTURE.spec, __unknownX: 1 } };
    const result = backendTrafficPolicySchema.safeParse(obj);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect((result.data.spec as Record<string, unknown>)["__unknownX"]).toBe(1);
  });

  it("(e) defensive: metadata only, no spec and no status", () => {
    const obj = {
      apiVersion: "gateway.envoyproxy.io/v1alpha1",
      kind: "BackendTrafficPolicy",
      metadata: {
        name: "bare-btp",
        uid: "aaaaaaaa-0000-0000-0000-000000000003",
        creationTimestamp: "2026-01-01T00:00:00Z",
      },
    };
    expect(backendTrafficPolicySchema.safeParse(obj).success).toBe(true);
  });
});
