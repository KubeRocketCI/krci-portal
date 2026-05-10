import { describe, expect, it } from "vitest";
import { k8sNamespaceConfig } from "./constants.js";

describe("k8sNamespaceConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sNamespaceConfig).toMatchObject({
      group: "",
      version: "v1",
      apiVersion: "v1",
      kind: "Namespace",
      singularName: "namespace",
      pluralName: "namespaces",
      clusterScoped: true,
    });
  });

  it("is cluster-scoped", () => {
    expect(k8sNamespaceConfig.clusterScoped).toBe(true);
  });
});
