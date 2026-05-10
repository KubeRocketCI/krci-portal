import { describe, expect, it } from "vitest";
import { k8sHorizontalPodAutoscalerConfig } from "./constants.js";

describe("k8sHorizontalPodAutoscalerConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sHorizontalPodAutoscalerConfig).toMatchObject({
      group: "autoscaling",
      version: "v2",
      apiVersion: "autoscaling/v2",
      kind: "HorizontalPodAutoscaler",
      singularName: "horizontalpodautoscaler",
      pluralName: "horizontalpodautoscalers",
    });
  });
});
