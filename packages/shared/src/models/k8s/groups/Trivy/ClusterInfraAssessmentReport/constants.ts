import { K8sResourceConfig } from "../../../common/index.js";

export const k8sClusterInfraAssessmentReportConfig = {
  apiVersion: "aquasecurity.github.io/v1alpha1",
  version: "v1alpha1",
  kind: "ClusterInfraAssessmentReport",
  group: "aquasecurity.github.io",
  singularName: "clusterinfraassessmentreport",
  pluralName: "clusterinfraassessmentreports",
  clusterScoped: true,
} as const satisfies K8sResourceConfig;
