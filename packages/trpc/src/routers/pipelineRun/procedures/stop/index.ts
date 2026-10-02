import { summarizePipelineRunStop } from "@my-project/shared";
import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { stopInputSchema, stopOutputSchema } from "../../../../schemas/pipelineRunStop.js";
import { getInitializedK8sClient } from "../../../k8s/utils/getInitializedK8sClient/index.js";
import { stopPipelineRuns } from "../../stopPipelineRuns.js";

export const pipelineRunStopProcedure = protectedProcedure
  .meta({
    openapi: {
      method: "POST",
      path: "/v1/pipelineruns/stop",
      protect: true,
      tags: ["pipelinerun"],
      // Per-run failures are reported in `results` with HTTP 200.
      errorResponses: [400, 401, 500],
    },
  })
  .input(stopInputSchema)
  .output(stopOutputSchema)
  .mutation(async ({ input, ctx }): Promise<z.infer<typeof stopOutputSchema>> => {
    const results = await stopPipelineRuns(getInitializedK8sClient(ctx), input.runs);

    return { results, summary: summarizePipelineRunStop(results) };
  });
