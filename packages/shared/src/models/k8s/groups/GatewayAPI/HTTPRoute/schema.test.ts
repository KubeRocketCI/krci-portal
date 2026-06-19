import { describe, it, expect } from "vitest";
import { httpRouteSchema } from "./schema.js";

const FIXTURE = {
  apiVersion: "gateway.networking.k8s.io/v1",
  kind: "HTTPRoute",
  metadata: {
    name: "backend",
    namespace: "eg-demo",
    uid: "3f0cba0f-8b55-49e8-95ab-238e7447d85f",
    creationTimestamp: "2026-06-13T11:23:33Z",
  },
  spec: {
    hostnames: ["www.example.com"],
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
            name: "backend",
            port: 3000,
            weight: 1,
          },
        ],
        matches: [
          {
            path: { type: "PathPrefix", value: "/" },
          },
        ],
      },
    ],
  },
  status: {
    parents: [
      {
        conditions: [
          { reason: "Accepted", status: "True", type: "Accepted" },
          { reason: "ResolvedRefs", status: "True", type: "ResolvedRefs" },
        ],
        controllerName: "gateway.envoyproxy.io/gatewayclass-controller",
        parentRef: {
          group: "gateway.networking.k8s.io",
          kind: "Gateway",
          name: "eg",
        },
      },
    ],
  },
};

describe("httpRouteSchema", () => {
  it("(a) minimal-valid: required metadata fields only, empty spec", () => {
    const obj = {
      apiVersion: "gateway.networking.k8s.io/v1",
      kind: "HTTPRoute",
      metadata: {
        name: "minimal",
        uid: "00000000-0000-0000-0000-000000000000",
        creationTimestamp: "2026-01-01T00:00:00Z",
      },
      spec: {},
    };
    expect(httpRouteSchema.safeParse(obj).success).toBe(true);
  });

  it("(b) partial/early: no status, no optional spec fields", () => {
    const obj = {
      apiVersion: "gateway.networking.k8s.io/v1",
      kind: "HTTPRoute",
      metadata: {
        name: "early",
        uid: "11111111-1111-1111-1111-111111111111",
        creationTimestamp: "2026-01-01T00:00:00Z",
      },
      spec: {
        hostnames: ["early.example.com"],
      },
    };
    const result = httpRouteSchema.safeParse(obj);
    expect(result.success).toBe(true);
  });

  it("(c) real-sample: fixture parses and UI-read fields are accessible", () => {
    const result = httpRouteSchema.safeParse(FIXTURE);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.spec?.hostnames).toEqual(["www.example.com"]);
    expect(result.data.spec?.parentRefs?.[0].name).toBe("eg");
    expect(result.data.spec?.rules?.[0].backendRefs?.[0].port).toBe(3000);
    expect(result.data.status?.parents?.[0].conditions?.[0].type).toBe("Accepted");
  });

  it("(d) forward-compat: unknown fields in spec are preserved (passthrough)", () => {
    const extended = {
      ...FIXTURE,
      spec: {
        ...FIXTURE.spec,
        __unknownX: 1,
      },
    };
    const result = httpRouteSchema.safeParse(extended);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect((result.data.spec as Record<string, unknown>)["__unknownX"]).toBe(1);
  });

  it("(e) defensive: object with metadata but no spec and no status parses successfully", () => {
    const obj = {
      apiVersion: "gateway.networking.k8s.io/v1",
      kind: "HTTPRoute",
      metadata: {
        name: "no-spec",
        uid: "22222222-2222-2222-2222-222222222222",
        creationTimestamp: "2026-01-01T00:00:00Z",
      },
    };
    expect(httpRouteSchema.safeParse(obj).success).toBe(true);
  });
});
