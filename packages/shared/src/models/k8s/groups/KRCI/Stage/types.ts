import z from "zod";
import {
  createStageDraftInputSchema,
  stageDraftSchema,
  stageQualityGateTypeEnum,
  stageSchema,
  stageSourceTypeEnum,
  stageStatusEnum,
  stageTriggerTypeEnum,
  stageQualityGateSchema,
  editStageInputSchema,
} from "./schema";

export type Stage = z.infer<typeof stageSchema>;
export type StageDraft = z.infer<typeof stageDraftSchema>;

export type StageStatus = z.infer<typeof stageStatusEnum>;
export type StageQualityGate = z.infer<typeof stageQualityGateSchema>;
export type StageQualityGateType = z.infer<typeof stageQualityGateTypeEnum>;
export type StageSourceType = z.infer<typeof stageSourceTypeEnum>;
export type StageTriggerType = z.infer<typeof stageTriggerTypeEnum>;

export type CreateStageDraftInput = z.infer<typeof createStageDraftInputSchema>;
export type EditStageInput = z.infer<typeof editStageInputSchema>;
