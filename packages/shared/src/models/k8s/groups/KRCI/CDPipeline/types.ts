import z from "zod";
import {
  cdPipelineDeploymentTypeEnum,
  cdPipelineDraftSchema,
  cdPipelineSchema,
  cdPipelineStatusEnum,
} from "./schema";

export type CDPipeline = z.infer<typeof cdPipelineSchema>;
export type CDPipelineDraft = z.infer<typeof cdPipelineDraftSchema>;

export type CDPipelineStatus = z.infer<typeof cdPipelineStatusEnum>;
export type CDPipelineDeploymentType = z.infer<
  typeof cdPipelineDeploymentTypeEnum
>;
