import { describe, expect, it } from "vitest";
import { k8sStatefulSetConfig } from "./constants.js";

describe("k8sStatefulSetConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sStatefulSetConfig).toMatchObject({
      group: "apps",
      version: "v1",
      apiVersion: "apps/v1",
      kind: "StatefulSet",
      singularName: "statefulset",
      pluralName: "statefulsets",
    });
  });
});
