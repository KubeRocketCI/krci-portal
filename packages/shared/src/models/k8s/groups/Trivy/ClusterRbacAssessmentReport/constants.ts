import { K8sResourceConfig } from "../../../common/index.js";

export const k8sClusterRbacAssessmentReportConfig = {
  apiVersion: "aquasecurity.github.io/v1alpha1",
  version: "v1alpha1",
  kind: "ClusterRbacAssessmentReport",
  group: "aquasecurity.github.io",
  singularName: "clusterrbacassessmentreport",
  pluralName: "clusterrbacassessmentreports",
  clusterScoped: true,
} as const satisfies K8sResourceConfig;
