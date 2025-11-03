import { K8sResourceConfig } from "../../../common";
import { jiraServerStatusEnum } from "./schema";

export const k8sJiraServerConfig = {
  apiVersion: "v2.edp.epam.com/v1",
  version: "v1",
  kind: "JiraServer",
  group: "v2.edp.epam.com",
  singularName: "jiraserver",
  pluralName: "jiraservers",
} as const satisfies K8sResourceConfig;

export const jiraServerStatus = jiraServerStatusEnum.enum;
