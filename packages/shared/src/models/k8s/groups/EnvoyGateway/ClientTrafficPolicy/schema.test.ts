import { describe, it, expect } from "vitest";
import { clientTrafficPolicySchema } from "./schema.js";

const FIXTURE = {
  apiVersion: "gateway.envoyproxy.io/v1alpha1",
  kind: "ClientTrafficPolicy",
  metadata: {
    name: "ctp-demo",
    namespace: "eg-demo",
    uid: "79d00609-2d18-4376-9784-36c6871b0c9c",
    creationTimestamp: "2026-06-13T11:23:33Z",
  },
  spec: {
    targetRefs: [{ group: "gateway.networking.k8s.io", kind: "Gateway", name: "eg" }],
    timeout: { http: { requestReceivedTimeout: "10s" } },
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

describe("clientTrafficPolicySchema", () => {
  it("(a) minimal-valid: required metadata + apiVersion + kind + empty spec parses successfully", () => {
    const obj = {
      apiVersion: "gateway.envoyproxy.io/v1alpha1",
      kind: "ClientTrafficPolicy",
      metadata: {
        name: "ctp-minimal",
        uid: "00000000-0000-0000-0000-000000000001",
        creationTimestamp: "2026-01-01T00:00:00Z",
      },
      spec: {},
    };
    expect(clientTrafficPolicySchema.safeParse(obj).success).toBe(true);
  });

  it("(b) partial/early: object without status and missing optional spec fields parses successfully", () => {
    const obj = {
      apiVersion: "gateway.envoyproxy.io/v1alpha1",
      kind: "ClientTrafficPolicy",
      metadata: {
        name: "ctp-partial",
        uid: "00000000-0000-0000-0000-000000000002",
        creationTimestamp: "2026-01-01T00:00:00Z",
      },
      spec: {
        targetRefs: [{ group: "gateway.networking.k8s.io", kind: "Gateway", name: "eg" }],
      },
    };
    expect(clientTrafficPolicySchema.safeParse(obj).success).toBe(true);
  });

  it("(c) real-sample: fixture parses and UI-read fields are accessible", () => {
    const result = clientTrafficPolicySchema.safeParse(FIXTURE);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.spec?.targetRefs?.[0].kind).toBe("Gateway");
    expect(result.data.spec?.targetRefs?.[0].name).toBe("eg");
    expect(result.data.status?.ancestors?.[0].conditions?.[0].type).toBe("Accepted");
  });

  it("(d) forward-compat: unknown fields in spec are preserved via passthrough", () => {
    const obj = {
      ...FIXTURE,
      spec: { ...FIXTURE.spec, __unknownX: 1 },
    };
    const result = clientTrafficPolicySchema.safeParse(obj);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect((result.data.spec as Record<string, unknown>)["__unknownX"]).toBe(1);
  });

  it("(e) defensive: object with metadata but no spec and no status parses successfully", () => {
    const obj = {
      apiVersion: "gateway.envoyproxy.io/v1alpha1",
      kind: "ClientTrafficPolicy",
      metadata: {
        name: "ctp-empty",
        uid: "00000000-0000-0000-0000-000000000003",
        creationTimestamp: "2026-01-01T00:00:00Z",
      },
    };
    expect(clientTrafficPolicySchema.safeParse(obj).success).toBe(true);
  });
});
