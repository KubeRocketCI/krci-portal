import { describe, expect, it } from "vitest";
import { k8sPersistentVolumeConfig } from "./constants.js";

describe("k8sPersistentVolumeConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sPersistentVolumeConfig).toMatchObject({
      group: "",
      version: "v1",
      apiVersion: "v1",
      kind: "PersistentVolume",
      singularName: "persistentvolume",
      pluralName: "persistentvolumes",
      clusterScoped: true,
    });
  });

  it("is cluster-scoped", () => {
    expect(k8sPersistentVolumeConfig.clusterScoped).toBe(true);
  });
});
