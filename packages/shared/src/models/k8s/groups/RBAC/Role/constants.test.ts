import { describe, expect, it } from "vitest";
import { k8sRoleConfig } from "./constants.js";

describe("k8sRoleConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sRoleConfig).toMatchObject({
      group: "rbac.authorization.k8s.io",
      version: "v1",
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "Role",
      singularName: "role",
      pluralName: "roles",
    });
  });

  it("is not cluster-scoped", () => {
    expect(k8sRoleConfig).not.toHaveProperty("clusterScoped");
  });
});
