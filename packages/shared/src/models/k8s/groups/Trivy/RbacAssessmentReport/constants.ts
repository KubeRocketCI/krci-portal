import { K8sResourceConfig } from "../../../common/index.js";
import { rbacAssessmentReportLabels } from "./labels.js";

export const k8sRbacAssessmentReportConfig = {
  apiVersion: "aquasecurity.github.io/v1alpha1",
  version: "v1alpha1",
  kind: "RbacAssessmentReport",
  group: "aquasecurity.github.io",
  singularName: "rbacassessmentreport",
  pluralName: "rbacassessmentreports",
} as const satisfies K8sResourceConfig<typeof rbacAssessmentReportLabels>;
