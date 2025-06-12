import { K8sResourceConfig } from "../../../core/types";
import {
  stageQualityGateTypeEnum,
  stageSourceTypeEnum,
  stageTriggerTypeEnum,
  stageResultEnum,
  stageStatusEnum,
} from "./schema";

export const stageLabels = {
  cdPipeline: "app.edp.epam.com/cdPipelineName",
} as const;

export const k8sStageConfig = {
  apiVersion: "v2.edp.epam.com/v1",
  group: "v2.edp.epam.com",
  version: "v1",
  kind: "Stage",
  singularName: "stage",
  pluralName: "stages",
} as const satisfies K8sResourceConfig<typeof stageLabels>;

export const stageStatus = stageStatusEnum.enum;
export const stageResult = stageResultEnum.enum;
export const stageQualityGateType = stageQualityGateTypeEnum.enum;
export const stageSourceType = stageSourceTypeEnum.enum;
export const stageTriggerType = stageTriggerTypeEnum.enum;
