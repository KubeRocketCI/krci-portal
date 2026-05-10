import { describe, expect, it } from "vitest";
import { k8sClusterRoleConfig } from "./constants.js";

describe("k8sClusterRoleConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sClusterRoleConfig).toMatchObject({
      group: "rbac.authorization.k8s.io",
      version: "v1",
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "ClusterRole",
      singularName: "clusterrole",
      pluralName: "clusterroles",
    });
  });

  it("is cluster-scoped", () => {
    expect(k8sClusterRoleConfig.clusterScoped).toBe(true);
  });
});
