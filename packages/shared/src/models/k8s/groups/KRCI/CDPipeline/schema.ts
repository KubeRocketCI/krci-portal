import z from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema } from "../../../core";

export const cdPipelineStatusEnum = z.enum([
  "created",
  "initialized",
  "in_progress",
  "failed",
]);

export const cdPipelineResultEnum = z.enum(["success", "error"]);

export const cdPipelineDeploymentTypeEnum = z.enum(["container", "custom"]);

const cdPipelineSpecSchema = z.object({
  applications: z.array(z.string()).min(1),
  applicationsToPromote: z.array(z.string()).nullable().optional(),
  deploymentType: cdPipelineDeploymentTypeEnum.default("container"),
  description: z.string().optional(),
  inputDockerStreams: z.array(z.string()).min(1),
  name: z.string().min(2),
});

const cdPipelineStatusSchema = z.object({
  action: z.string(),
  available: z.boolean().default(false),
  detailed_message: z.string().optional(),
  last_time_updated: z.string().datetime(),
  result: z.enum(["success", "error"]),
  status: z.string(),
  username: z.string(),
  value: z.string(),
});

export const cdPipelineSchema = kubeObjectBaseSchema.extend({
  spec: cdPipelineSpecSchema,
  status: cdPipelineStatusSchema.optional(),
});

export const cdPipelineDraftSchema = kubeObjectBaseDraftSchema.extend({
  spec: cdPipelineSpecSchema,
});

export const createCDPipelineDraftInputSchema = z.object({
  applications: cdPipelineDraftSchema.shape.spec.shape.applications,
  applicationsToPromote:
    cdPipelineDraftSchema.shape.spec.shape.applicationsToPromote,
  deploymentType: cdPipelineDraftSchema.shape.spec.shape.deploymentType,
  description: cdPipelineDraftSchema.shape.spec.shape.description,
  inputDockerStreams: cdPipelineDraftSchema.shape.spec.shape.inputDockerStreams,
  name: cdPipelineDraftSchema.shape.spec.shape.name,
});
