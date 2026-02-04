import { K8sResourceConfig } from "../../../common/index.js";
import { infraAssessmentReportLabels } from "./labels.js";

export const k8sInfraAssessmentReportConfig = {
  apiVersion: "aquasecurity.github.io/v1alpha1",
  version: "v1alpha1",
  kind: "InfraAssessmentReport",
  group: "aquasecurity.github.io",
  singularName: "infraassessmentreport",
  pluralName: "infraassessmentreports",
} as const satisfies K8sResourceConfig<typeof infraAssessmentReportLabels>;
