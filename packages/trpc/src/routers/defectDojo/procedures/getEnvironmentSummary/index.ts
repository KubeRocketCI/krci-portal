import { environmentSummaryInputSchema, environmentSummarySchema } from "@my-project/shared";
import { createDefectDojoClient, isDefectDojoConfigured } from "../../../../clients/defectDojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { composeEnvironmentSummary } from "../../environmentSummary/compose.js";
import { loadEnvironmentFacts } from "../../environmentSummary/facts.js";

/**
 * The findings of the workloads of an Environment, for the Applications and Overview tabs of its Stage page. The
 * Stage and the Applications come from the Kubernetes objects the signed-in user can read, not from the browser.
 */
export const getEnvironmentSummaryProcedure = protectedProcedure
  .input(environmentSummaryInputSchema)
  .output(environmentSummarySchema)
  .query(async ({ input, ctx }) => {
    if (!isDefectDojoConfigured(process.env)) {
      return { state: "notConfigured" };
    }

    const facts = await loadEnvironmentFacts(ctx.session, input);
    return composeEnvironmentSummary(createDefectDojoClient(), facts);
  });
