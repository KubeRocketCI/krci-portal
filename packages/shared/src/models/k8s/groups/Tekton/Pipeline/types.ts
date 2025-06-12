import z from "zod";
import { pipelineDraftSchema, pipelineSchema } from ".";

export type Pipeline = z.infer<typeof pipelineSchema>;
export type PipelineDraft = z.infer<typeof pipelineDraftSchema>;
