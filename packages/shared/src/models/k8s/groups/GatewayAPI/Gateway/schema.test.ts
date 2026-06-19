import { describe, expect, it } from "vitest";
import { gatewaySchema } from "./schema.js";

const FIXTURE = {
  apiVersion: "gateway.networking.k8s.io/v1",
  kind: "Gateway",
  metadata: {
    name: "eg",
    namespace: "eg-demo",
    uid: "468aaa1e-9a6f-4944-9679-37a1c47eddec",
    creationTimestamp: "2026-06-13T11:23:33Z",
  },
  spec: {
    gatewayClassName: "eg",
    listeners: [
      {
        allowedRoutes: { namespaces: { from: "Same" } },
        name: "http",
        port: 80,
        protocol: "HTTP",
      },
    ],
  },
  status: {
    conditions: [
      {
        lastTransitionTime: "2026-06-13T21:02:27Z",
        message: "The Gateway has been scheduled by Envoy Gateway",
        observedGeneration: 1,
        reason: "Accepted",
        status: "True",
        type: "Accepted",
      },
      {
        lastTransitionTime: "2026-06-13T21:02:27Z",
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
          { reason: "Programmed", status: "True", type: "Programmed" },
          { reason: "Accepted", status: "True", type: "Accepted" },
          { reason: "ResolvedRefs", status: "True", type: "ResolvedRefs" },
        ],
        name: "http",
        supportedKinds: [{ group: "gateway.networking.k8s.io", kind: "HTTPRoute" }],
      },
    ],
  },
};

describe("gatewaySchema", () => {
  it("(a) minimal-valid: required spec fields only", () => {
    const obj = {
      apiVersion: "gateway.networking.k8s.io/v1",
      kind: "Gateway",
      metadata: { name: "gw", uid: "uid-1", creationTimestamp: "2026-01-01T00:00:00Z" },
      spec: {
        gatewayClassName: "eg",
        listeners: [{ name: "http", port: 80, protocol: "HTTP" }],
      },
    };
    expect(gatewaySchema.safeParse(obj).success).toBe(true);
  });

  it("(b) partial/early: no status, no optional spec fields", () => {
    const obj = {
      apiVersion: "gateway.networking.k8s.io/v1",
      kind: "Gateway",
      metadata: { name: "gw", uid: "uid-2", creationTimestamp: "2026-01-01T00:00:00Z" },
      spec: {
        gatewayClassName: "eg",
        listeners: [{ name: "http", port: 443, protocol: "HTTPS" }],
      },
    };
    expect(gatewaySchema.safeParse(obj).success).toBe(true);
  });

  it("(c) real-sample: fixture parses and UI-read fields are typed", () => {
    const result = gatewaySchema.safeParse(FIXTURE);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.spec?.gatewayClassName).toBe("eg");
    expect(result.data.spec?.listeners[0].name).toBe("http");
    expect(result.data.spec?.listeners[0].port).toBe(80);
    expect(result.data.spec?.listeners[0].protocol).toBe("HTTP");
    expect(result.data.status?.listeners?.[0].attachedRoutes).toBe(1);
    expect(result.data.status?.conditions?.[0].type).toBe("Accepted");
  });

  it("(d) forward-compat: unknown field in spec is preserved (passthrough)", () => {
    const withJunk = { ...FIXTURE, spec: { ...FIXTURE.spec, __unknownX: 1 } };
    const result = gatewaySchema.safeParse(withJunk);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect((result.data.spec as Record<string, unknown>).__unknownX).toBe(1);
  });

  it("(e) defensive: object with metadata but no spec and no status parses successfully", () => {
    const obj = {
      apiVersion: "gateway.networking.k8s.io/v1",
      kind: "Gateway",
      metadata: { name: "gw", uid: "uid-3", creationTimestamp: "2026-01-01T00:00:00Z" },
    };
    expect(gatewaySchema.safeParse(obj).success).toBe(true);
  });
});
