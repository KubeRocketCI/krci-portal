import { K8sResourceConfig } from "../../../core";
import { applicationLabels } from "./labels";

export const k8sApplicationConfig = {
  apiVersion: "argoproj.io/v1alpha1",
  version: "v1alpha1",
  kind: "Application",
  group: "argoproj.io",
  singularName: "application",
  pluralName: "applications",
} as const satisfies K8sResourceConfig<typeof applicationLabels>;
