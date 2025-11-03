import z from "zod";
import { pipelineRunDraftSchema, pipelineRunReasonEnum, pipelineRunSchema, pipelineRunStatusEnum } from ".";

export type PipelineRunReason = z.infer<typeof pipelineRunReasonEnum>;
export type PipelineRunStatus = z.infer<typeof pipelineRunStatusEnum>;

export type PipelineRun = z.infer<typeof pipelineRunSchema>;
export type PipelineRunDraft = z.infer<typeof pipelineRunDraftSchema>;
