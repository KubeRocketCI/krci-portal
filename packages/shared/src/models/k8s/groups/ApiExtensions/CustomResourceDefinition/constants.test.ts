import { describe, expect, it } from "vitest";
import { k8sCustomResourceDefinitionConfig } from "./constants.js";

describe("k8sCustomResourceDefinitionConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sCustomResourceDefinitionConfig).toMatchObject({
      apiVersion: "apiextensions.k8s.io/v1",
      kind: "CustomResourceDefinition",
      group: "apiextensions.k8s.io",
      version: "v1",
      singularName: "customresourcedefinition",
      pluralName: "customresourcedefinitions",
      clusterScoped: true,
    });
  });

  it("is cluster-scoped", () => {
    expect(k8sCustomResourceDefinitionConfig.clusterScoped).toBe(true);
  });
});
