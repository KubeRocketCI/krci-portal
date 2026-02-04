import { K8sResourceConfig } from "../../../common/index.js";

export const k8sClusterConfigAuditReportConfig = {
  apiVersion: "aquasecurity.github.io/v1alpha1",
  version: "v1alpha1",
  kind: "ClusterConfigAuditReport",
  group: "aquasecurity.github.io",
  singularName: "clusterconfigauditreport",
  pluralName: "clusterconfigauditreports",
  clusterScoped: true,
} as const satisfies K8sResourceConfig;
