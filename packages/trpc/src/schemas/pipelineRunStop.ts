import {
  PIPELINE_RUN_STOP_MAX_RUNS,
  pipelineRunStopResultEnum,
  pipelineRunStopSkipReasonEnum,
} from "@my-project/shared";
import { z } from "zod";
import { tektonInputSchemas } from "./tektonInput.js";

const pipelineRunRefSchema = z
  .object({
    namespace: tektonInputSchemas.namespace,
    name: tektonInputSchemas.k8sName,
  })
  .strict();

export const stopInputSchema = z
  .object({
    runs: z.array(pipelineRunRefSchema).min(1).max(PIPELINE_RUN_STOP_MAX_RUNS),
  })
  .strict();

const pipelineRunStopReasonEnum = z.enum([...pipelineRunStopSkipReasonEnum.options, "not_found", "forbidden", "error"]);
export const pipelineRunStopReason = pipelineRunStopReasonEnum.enum;

/**
 * Outcome for one requested run. `reason` is set for `skipped` and `failed`.
 *
 * Public OpenAPI contract: flat object, no discriminated union; enum values must not change.
 */
export const pipelineRunStopOutcomeSchema = pipelineRunRefSchema
  .extend({
    result: pipelineRunStopResultEnum,
    reason: pipelineRunStopReasonEnum.optional(),
  })
  .strict();

export type PipelineRunStopOutcome = z.infer<typeof pipelineRunStopOutcomeSchema>;

/** `results` follows input order with duplicate runs removed. */
export const stopOutputSchema = z
  .object({
    results: z.array(pipelineRunStopOutcomeSchema),
    summary: z
      .object({
        stopping: z.number().int(),
        skipped: z.number().int(),
        failed: z.number().int(),
      })
      .strict(),
  })
  .strict();
