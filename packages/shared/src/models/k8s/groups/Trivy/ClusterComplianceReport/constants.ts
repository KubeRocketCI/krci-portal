import { K8sResourceConfig } from "../../../common/index.js";

export const k8sClusterComplianceReportConfig = {
  apiVersion: "aquasecurity.github.io/v1alpha1",
  version: "v1alpha1",
  kind: "ClusterComplianceReport",
  group: "aquasecurity.github.io",
  singularName: "clustercompliancereport",
  pluralName: "clustercompliancereports",
  clusterScoped: true,
} as const satisfies K8sResourceConfig;
