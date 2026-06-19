import { describe, expect, it } from "vitest";
import { securityPolicySchema } from "./schema.js";

const FIXTURE = {
  apiVersion: "gateway.envoyproxy.io/v1alpha1",
  kind: "SecurityPolicy",
  metadata: {
    name: "cors-demo",
    namespace: "eg-demo",
    uid: "caaeb878-5cda-4824-9b1e-51044fee0ae0",
    creationTimestamp: "2026-06-13T11:28:45Z",
  },
  spec: {
    cors: { allowMethods: ["GET", "POST"], allowOrigins: ["https://example.com"] },
    targetRefs: [{ group: "gateway.networking.k8s.io", kind: "HTTPRoute", name: "backend" }],
  },
  status: {
    ancestors: [
      {
        ancestorRef: { group: "gateway.networking.k8s.io", kind: "Gateway", name: "eg", namespace: "eg-demo" },
        conditions: [{ reason: "Accepted", status: "True", type: "Accepted" }],
        controllerName: "gateway.envoyproxy.io/gatewayclass-controller",
      },
    ],
  },
};

describe("securityPolicySchema", () => {
  it("(a) minimal-valid: required metadata + kind + apiVersion + empty spec parses", () => {
    const obj = {
      apiVersion: "gateway.envoyproxy.io/v1alpha1",
      kind: "SecurityPolicy",
      metadata: { name: "sp-min", uid: "uid-min-001", creationTimestamp: "2026-06-01T00:00:00Z" },
      spec: {},
    };
    expect(securityPolicySchema.safeParse(obj).success).toBe(true);
  });

  it("(b) partial/early: spec present but status absent (early-reconcile path)", () => {
    // Distinct from (e) which has no spec at all; this exercises the path where
    // the object has been created with spec but the controller hasn't written status yet.
    const obj = {
      apiVersion: "gateway.envoyproxy.io/v1alpha1",
      kind: "SecurityPolicy",
      metadata: { name: "sp-early", uid: "uid-early-002", creationTimestamp: "2026-06-01T00:00:00Z" },
      spec: { cors: { allowOrigins: ["https://example.com"] } },
    };
    const result = securityPolicySchema.safeParse(obj);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.status).toBeUndefined();
    expect((result.data.spec as Record<string, unknown>)?.["cors"]).toBeDefined();
  });

  it("(c) real-sample: fixture parses and UI-read fields are typed correctly", () => {
    const result = securityPolicySchema.safeParse(FIXTURE);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const { spec, status } = result.data;
    expect(spec?.targetRefs?.[0]?.kind).toBe("HTTPRoute");
    expect(spec?.targetRefs?.[0]?.name).toBe("backend");
    expect(status?.ancestors?.[0]?.conditions?.[0]?.type).toBe("Accepted");
    expect(status?.ancestors?.[0]?.conditions?.[0]?.status).toBe("True");
    expect(spec?.cors).toBeDefined();
  });

  it("(d) forward-compat: unknown field in spec is preserved (passthrough)", () => {
    const extended = { ...FIXTURE, spec: { ...FIXTURE.spec, __unknownX: 1 } };
    const result = securityPolicySchema.safeParse(extended);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect((result.data.spec as Record<string, unknown>)["__unknownX"]).toBe(1);
  });

  it("(e) defensive: object with metadata but no spec and no status parses", () => {
    const obj = {
      apiVersion: "gateway.envoyproxy.io/v1alpha1",
      kind: "SecurityPolicy",
      metadata: { name: "sp-nospec", uid: "uid-nospec-003", creationTimestamp: "2026-06-01T00:00:00Z" },
    };
    const result = securityPolicySchema.safeParse(obj);
    expect(result.success).toBe(true);
  });
});
