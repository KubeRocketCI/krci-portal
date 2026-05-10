import { describe, expect, it } from "vitest";
import { k8sServiceConfig } from "./constants.js";

describe("k8sServiceConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sServiceConfig).toMatchObject({
      group: "",
      version: "v1",
      apiVersion: "v1",
      kind: "Service",
      singularName: "service",
      pluralName: "services",
    });
  });

  it("does not have clusterScoped set", () => {
    expect(k8sServiceConfig).not.toHaveProperty("clusterScoped");
  });
});
