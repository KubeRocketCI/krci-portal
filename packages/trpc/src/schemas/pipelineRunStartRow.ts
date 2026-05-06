import { z } from "zod";

/**
 * Row shape returned by the `pipelineRun.start` procedure on the live-create
 * path. Mirrors the `krci pipelinerun list` columns exactly so CLI users
 * pivot directly between the two verbs.
 */
export const pipelineRunStartRowSchema = z
  .object({
    name: z.string(),
    status: z.string(),
    project: z.string(),
    pr: z.string(),
    author: z.string(),
    type: z.string(),
    started: z.string(),
    duration: z.string(),
  })
  .strict();

export type PipelineRunStartRow = z.infer<typeof pipelineRunStartRowSchema>;
