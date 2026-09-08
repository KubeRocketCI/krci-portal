import { describe, expect, it } from "vitest";
import { k8sTenantConfig } from "./constants.js";

describe("k8sTenantConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sTenantConfig).toMatchObject({
      group: "capsule.clastix.io",
      version: "v1beta2",
      apiVersion: "capsule.clastix.io/v1beta2",
      kind: "Tenant",
      singularName: "tenant",
      pluralName: "tenants",
    });
  });

  // A Tenant groups namespaces, so it cannot live in one. Without the flag the URL
  // builders take the namespaced branch and every request 404s.
  it("is cluster-scoped", () => {
    expect(k8sTenantConfig.clusterScoped).toBe(true);
  });
});
