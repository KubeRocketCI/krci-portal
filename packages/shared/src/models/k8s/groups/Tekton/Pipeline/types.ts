import z from "zod";
import { pipelineSchema, pipelineSpecSchema, pipelineTaskSchema, pipelineTypeEnum, pipelineDraftSchema } from "./index.js";

export type Pipeline = z.infer<typeof pipelineSchema>;

export type PipelineType = z.infer<typeof pipelineTypeEnum>;

export type PipelineSpec = z.infer<typeof pipelineSpecSchema>;

export type PipelineTask = z.infer<typeof pipelineTaskSchema>;

export type PipelineDraft = z.infer<typeof pipelineDraftSchema>;
