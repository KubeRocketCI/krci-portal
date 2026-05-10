import { describe, expect, it } from "vitest";
import { k8sRoleBindingConfig } from "./constants.js";

describe("k8sRoleBindingConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sRoleBindingConfig).toMatchObject({
      group: "rbac.authorization.k8s.io",
      version: "v1",
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "RoleBinding",
      singularName: "rolebinding",
      pluralName: "rolebindings",
    });
  });

  it("is not cluster-scoped", () => {
    expect(k8sRoleBindingConfig).not.toHaveProperty("clusterScoped");
  });
});
