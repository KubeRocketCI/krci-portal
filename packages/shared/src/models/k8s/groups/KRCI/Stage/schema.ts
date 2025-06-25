import z from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
  kubeObjectMetadataSchema,
} from "../../../core";
import { stageLabels } from "./labels";

export const stageStatusEnum = z.enum([
  "created",
  "initialized",
  "in_progress",
  "failed",
]);

export const stageResultEnum = z.enum(["success", "error"]);

export const stageQualityGateTypeEnum = z.enum(["manual", "autotests"]);

export const stageSourceTypeEnum = z.enum(["default", "library"]);

export const stageTriggerTypeEnum = z.enum(["Auto", "Manual", "Auto-stable"]);

const stageQualityGateSchema = z.object({
  qualityGateType: stageQualityGateTypeEnum.default("manual"),
  stepName: z.string().min(2),
  autotestName: z.string().nullable().optional(),
  branchName: z.string().nullable().optional(),
});

const stageSourceLibrarySchema = z
  .object({
    branch: z.string().optional(),
    name: z.string().optional(),
  })
  .nullable();

const stageSourceSchema = z.object({
  library: stageSourceLibrarySchema.optional(),
  type: stageSourceTypeEnum.default("default"),
});

const stageSpecSchema = z.object({
  cdPipeline: z.string().min(2),
  cleanTemplate: z.string().optional(),
  clusterName: z.string().default("in-cluster"),
  description: z.string().optional(),
  name: z.string().min(2),
  namespace: z.string(),
  order: z.number().int(),
  qualityGates: z.array(stageQualityGateSchema),
  source: stageSourceSchema.optional(),
  triggerTemplate: z.string(),
  triggerType: stageTriggerTypeEnum.default("Manual"),
});

const stageStatusSchema = z.object({
  action: z.string(),
  available: z.boolean().default(false),
  detailed_message: z.string().optional(),
  last_time_updated: z.string().datetime(),
  result: stageResultEnum,
  shouldBeHandled: z.boolean().default(false).optional(),
  status: stageStatusEnum,
  username: z.string(),
  value: z.string(),
});

const stageLabelsSchema = z.object({
  [stageLabels.cdPipeline]: z.string(),
});

export const stageSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema.extend({
    labels: stageLabelsSchema,
  }),
  spec: stageSpecSchema,
  status: stageStatusSchema.optional(),
});

export const stageDraftSchema = kubeObjectBaseDraftSchema.extend({
  metadata: kubeObjectDraftMetadataSchema.extend({
    labels: stageLabelsSchema,
  }),
  spec: stageSpecSchema,
});
