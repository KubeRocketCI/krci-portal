import z from "zod";
import { pipelineDraftSchema, pipelineSchema, pipelineTypeEnum } from ".";

export type Pipeline = z.infer<typeof pipelineSchema>;
export type PipelineDraft = z.infer<typeof pipelineDraftSchema>;

export type PipelineType = z.infer<typeof pipelineTypeEnum>;
