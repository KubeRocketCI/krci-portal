import { describe, expect, it } from "vitest";
import { k8sClusterRoleBindingConfig } from "./constants.js";

describe("k8sClusterRoleBindingConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sClusterRoleBindingConfig).toMatchObject({
      group: "rbac.authorization.k8s.io",
      version: "v1",
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "ClusterRoleBinding",
      singularName: "clusterrolebinding",
      pluralName: "clusterrolebindings",
    });
  });

  it("is cluster-scoped", () => {
    expect(k8sClusterRoleBindingConfig.clusterScoped).toBe(true);
  });
});
