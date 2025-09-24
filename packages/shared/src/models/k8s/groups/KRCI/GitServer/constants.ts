import { K8sResourceConfig } from "../../../common";

export const k8sGitServerConfig = {
  apiVersion: "v2.edp.epam.com/v1",
  version: "v1",
  kind: "GitServer",
  group: "v2.edp.epam.com",
  singularName: "gitserver",
  pluralName: "gitservers",
} as const satisfies K8sResourceConfig;
