import { K8sResourceConfig } from "../../../core/types";
import {
  codebaseCreationStrategyEnum,
  codebaseDeploymentScriptEnum,
  codebaseResultEnum,
  codebaseStatusEnum,
  codebaseTestReportFrameworkEnum,
  codebaseTypeEnum,
  codebaseVersioningEnum,
} from "./schema";

export const codebaseLabels = {
  codebaseType: "app.edp.epam.com/codebaseType",
  // gitserver: "app.edp.epam.com/gitserver",
  integration: "app.edp.epam.com/integration",
  systemType: "app.edp.epam.com/systemType",
} as const;

export const k8sCodebaseConfig = {
  apiVersion: "v2.edp.epam.com/v1",
  group: "v2.edp.epam.com",
  version: "v1",
  kind: "Codebase",
  singularName: "codebase",
  pluralName: "codebases",
  labels: codebaseLabels,
} as const satisfies K8sResourceConfig<typeof codebaseLabels>;

export const codebaseType = codebaseTypeEnum.enum;
export const codebaseCreationStrategy = codebaseCreationStrategyEnum.enum;
export const codebaseStatus = codebaseStatusEnum.enum;
export const codebaseResult = codebaseResultEnum.enum;
export const codebaseVersioning = codebaseVersioningEnum.enum;
export const codebaseDeploymentScript = codebaseDeploymentScriptEnum.enum;
export const codebaseTestReportFramework = codebaseTestReportFrameworkEnum.enum;
