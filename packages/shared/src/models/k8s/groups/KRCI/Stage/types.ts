import z from "zod";
import {
  stageDraftSchema,
  stageQualityGateTypeEnum,
  stageSchema,
  stageSourceTypeEnum,
  stageStatusEnum,
  stageTriggerTypeEnum,
} from "./schema";

export type Stage = z.infer<typeof stageSchema>;
export type StageDraft = z.infer<typeof stageDraftSchema>;

export type StageStatus = z.infer<typeof stageStatusEnum>;
export type StageQualityGate = z.infer<typeof stageQualityGateTypeEnum>;
export type StageSource = z.infer<typeof stageSourceTypeEnum>;
export type StageTrigger = z.infer<typeof stageTriggerTypeEnum>;
