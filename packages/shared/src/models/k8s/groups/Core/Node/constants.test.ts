import { describe, expect, it } from "vitest";
import { k8sNodeConfig } from "./constants.js";

describe("k8sNodeConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sNodeConfig).toMatchObject({
      group: "",
      version: "v1",
      apiVersion: "v1",
      kind: "Node",
      singularName: "node",
      pluralName: "nodes",
      clusterScoped: true,
    });
  });

  it("is cluster-scoped", () => {
    expect(k8sNodeConfig.clusterScoped).toBe(true);
  });
});
