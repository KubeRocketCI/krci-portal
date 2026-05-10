import { describe, expect, it } from "vitest";
import { k8sIngressConfig } from "./constants.js";

describe("k8sIngressConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sIngressConfig).toMatchObject({
      group: "networking.k8s.io",
      version: "v1",
      apiVersion: "networking.k8s.io/v1",
      kind: "Ingress",
      singularName: "ingress",
      pluralName: "ingresses",
    });
  });

  it("is not cluster-scoped", () => {
    expect(k8sIngressConfig).not.toHaveProperty("clusterScoped");
  });
});
