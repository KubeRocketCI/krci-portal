import z from "zod";
import { pipelineRunDraftSchema, pipelineRunPhaseEnum, pipelineRunReasonEnum, pipelineRunSchema } from "./index.js";

export type PipelineRunReason = z.infer<typeof pipelineRunReasonEnum>;
export type PipelineRunPhase = z.infer<typeof pipelineRunPhaseEnum>;

export type PipelineRun = z.infer<typeof pipelineRunSchema>;
export type PipelineRunDraft = z.infer<typeof pipelineRunDraftSchema>;

/** Result of classifying a PipelineRun's `Succeeded` condition via getPipelineRunStatus. */
export type PipelineRunStatusResult = {
  phase: PipelineRunPhase;
  reason: string | undefined;
  message: string;
  lastTransitionTime: string | undefined;
  startTime: string | undefined;
  completionTime: string | undefined;
};
