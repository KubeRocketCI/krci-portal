import { describe, expect, it } from "vitest";
import { tenantSchema } from "./schema.js";

const FIXTURE = {
  apiVersion: "capsule.clastix.io/v1beta2",
  kind: "Tenant",
  metadata: {
    name: "edp-workload-krci",
    uid: "2f0c1d7e-4b8a-4c2e-9f3a-1a2b3c4d5e6f",
    creationTimestamp: "2026-01-01T00:00:00Z",
  },
  spec: {
    owners: [{ kind: "ServiceAccount", name: "system:serviceaccount:krci:tenant-admin" }],
  },
};

describe("tenantSchema", () => {
  it.each(["Active", "Cordoned", "Terminating"])("accepts status.state %s", (state) => {
    const result = tenantSchema.safeParse({ ...FIXTURE, status: { size: 1, state } });

    expect(result.success).toBe(true);
    expect(result.data?.status?.state).toBe(state);
  });

  it("defaults status.state to Active", () => {
    const result = tenantSchema.parse({ ...FIXTURE, status: { size: 1 } });

    expect(result.status?.state).toBe("Active");
  });

  it("rejects an unknown status.state", () => {
    const result = tenantSchema.safeParse({ ...FIXTURE, status: { size: 1, state: "Unknown" } });

    expect(result.success).toBe(false);
  });
});
