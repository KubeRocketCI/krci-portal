import { describe, expect, it } from "vitest";
import { k8sDaemonSetConfig } from "./constants.js";

describe("k8sDaemonSetConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sDaemonSetConfig).toMatchObject({
      group: "apps",
      version: "v1",
      apiVersion: "apps/v1",
      kind: "DaemonSet",
      singularName: "daemonset",
      pluralName: "daemonsets",
    });
  });
});
