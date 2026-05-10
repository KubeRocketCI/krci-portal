import { describe, expect, it } from "vitest";
import { k8sStorageClassConfig } from "./constants.js";

describe("k8sStorageClassConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sStorageClassConfig).toMatchObject({
      group: "storage.k8s.io",
      version: "v1",
      apiVersion: "storage.k8s.io/v1",
      kind: "StorageClass",
      singularName: "storageclass",
      pluralName: "storageclasses",
    });
  });

  it("is cluster-scoped", () => {
    expect(k8sStorageClassConfig.clusterScoped).toBe(true);
  });
});
