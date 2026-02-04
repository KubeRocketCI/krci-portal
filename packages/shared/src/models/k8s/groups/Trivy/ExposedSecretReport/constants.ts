import { K8sResourceConfig } from "../../../common/index.js";
import { exposedSecretReportLabels } from "./labels.js";

export const k8sExposedSecretReportConfig = {
  apiVersion: "aquasecurity.github.io/v1alpha1",
  version: "v1alpha1",
  kind: "ExposedSecretReport",
  group: "aquasecurity.github.io",
  singularName: "exposedsecretreport",
  pluralName: "exposedsecretreports",
} as const satisfies K8sResourceConfig<typeof exposedSecretReportLabels>;
