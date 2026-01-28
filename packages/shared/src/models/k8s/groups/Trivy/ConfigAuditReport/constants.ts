import { K8sResourceConfig } from "../../../common/index.js";
import { configAuditReportLabels } from "./labels.js";

export const k8sConfigAuditReportConfig = {
  apiVersion: "aquasecurity.github.io/v1alpha1",
  version: "v1alpha1",
  kind: "ConfigAuditReport",
  group: "aquasecurity.github.io",
  singularName: "configauditreport",
  pluralName: "configauditreports",
} as const satisfies K8sResourceConfig<typeof configAuditReportLabels>;
