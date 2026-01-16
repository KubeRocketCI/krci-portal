import { K8sResourceConfig } from "../../../common/index.js";

export const k8sQuickLinkConfig = {
  apiVersion: "v2.edp.epam.com/v1",
  version: "v1",
  kind: "QuickLink",
  group: "v2.edp.epam.com",
  singularName: "quicklink",
  pluralName: "quicklinks",
} as const satisfies K8sResourceConfig;
