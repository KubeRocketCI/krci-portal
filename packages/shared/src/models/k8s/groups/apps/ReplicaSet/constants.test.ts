import { describe, expect, it } from "vitest";
import { k8sReplicaSetConfig } from "./constants.js";

describe("k8sReplicaSetConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sReplicaSetConfig).toMatchObject({
      group: "apps",
      version: "v1",
      apiVersion: "apps/v1",
      kind: "ReplicaSet",
      singularName: "replicaset",
      pluralName: "replicasets",
    });
  });

  it("is namespace-scoped (clusterScoped field omitted)", () => {
    // ReplicaSet lives under /apis/apps/v1/namespaces/.../replicasets, never cluster-wide.
    // Regression guard against an accidental flip to clusterScoped: true.
    expect("clusterScoped" in k8sReplicaSetConfig).toBe(false);
  });
});
