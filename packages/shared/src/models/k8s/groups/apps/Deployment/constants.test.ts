import { describe, expect, it } from "vitest";
import { k8sDeploymentConfig } from "./constants.js";

describe("k8sDeploymentConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sDeploymentConfig).toMatchObject({
      group: "apps",
      version: "v1",
      apiVersion: "apps/v1",
      kind: "Deployment",
      singularName: "deployment",
      pluralName: "deployments",
    });
  });
});
