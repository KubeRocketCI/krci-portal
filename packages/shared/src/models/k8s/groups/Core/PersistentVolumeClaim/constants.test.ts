import { describe, expect, it } from "vitest";
import { k8sPersistentVolumeClaimConfig } from "./constants.js";

describe("k8sPersistentVolumeClaimConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sPersistentVolumeClaimConfig).toMatchObject({
      group: "",
      version: "v1",
      apiVersion: "v1",
      kind: "PersistentVolumeClaim",
      singularName: "persistentvolumeclaim",
      pluralName: "persistentvolumeclaims",
    });
  });

  it("does not have clusterScoped set", () => {
    expect(k8sPersistentVolumeClaimConfig).not.toHaveProperty("clusterScoped");
  });
});
