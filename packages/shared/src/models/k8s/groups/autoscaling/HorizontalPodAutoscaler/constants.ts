import { K8sResourceConfig } from "../../../common/index.js";

export const k8sHorizontalPodAutoscalerConfig = {
  group: "autoscaling",
  version: "v2",
  apiVersion: "autoscaling/v2",
  kind: "HorizontalPodAutoscaler",
  singularName: "horizontalpodautoscaler",
  pluralName: "horizontalpodautoscalers",
} as const satisfies K8sResourceConfig;
