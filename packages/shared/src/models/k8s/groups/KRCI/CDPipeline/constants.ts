import { K8sResourceConfig } from "../../../common/types";
import {
  cdPipelineDeploymentTypeEnum,
  cdPipelineResultEnum,
  cdPipelineStatusEnum,
} from "./schema";

export const k8sCDPipelineConfig = {
  apiVersion: "v2.edp.epam.com/v1",
  group: "v2.edp.epam.com",
  version: "v1",
  kind: "CDPipeline",
  singularName: "cdpipeline",
  pluralName: "cdpipelines",
} as const satisfies K8sResourceConfig;

export const cdPipelineStatus = cdPipelineStatusEnum.enum;
export const cdPipelineResult = cdPipelineResultEnum.enum;
export const cdPipelineDeploymentType = cdPipelineDeploymentTypeEnum.enum;
