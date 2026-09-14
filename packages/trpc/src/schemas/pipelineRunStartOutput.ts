import { z } from "zod";
import { pipelineRunStartRowSchema } from "./pipelineRunStartRow.js";

/** Rendered PipelineRun resource as a JSON object. Never a serialised string. */
export const manifestSchema = z.record(z.string(), z.unknown());

/**
 * Output of every procedure that renders or creates a PipelineRun
 * (`pipelineRun.start`, `pipelineRun.build`), discriminated by `kind`:
 *   - `created`: `row` is the projected list entry of the created run.
 *   - `dryRun`: nothing was created; `manifest` is the rendered resource.
 *
 * Public OpenAPI contract: member shapes must not change.
 */
export const startOutputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("created"), row: pipelineRunStartRowSchema }).strict(),
  z.object({ kind: z.literal("dryRun"), manifest: manifestSchema }).strict(),
]);
