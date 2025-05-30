import z from "zod";
import { pipelineRunDraftSchema, pipelineRunSchema } from ".";

export type PipelineRun = z.infer<typeof pipelineRunSchema>;
export type PipelineRunDraft = z.infer<typeof pipelineRunDraftSchema>;
