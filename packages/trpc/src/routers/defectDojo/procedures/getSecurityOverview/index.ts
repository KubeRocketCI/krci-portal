import { securityOverviewInputSchema, securityOverviewSchema } from "@my-project/shared";
import { createDefectDojoClient, isDefectDojoConfigured } from "../../../../clients/defectDojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { loadPlatformFacts } from "../../platformFindings/facts.js";
import { loadRuntimePart, toSecurityOverview } from "../../securityOverview/namespaces.js";

/**
 * The Runtime part of the Security overview: the namespaces of the platform with the findings of their namespace
 * products, the exposed secrets apart. DefectDojo is read once per `SECURITY_OVERVIEW_CACHE_TTL_MS` for every caller;
 * the Stages are read with the signed-in user's access.
 */
export const getSecurityOverviewProcedure = protectedProcedure
  .input(securityOverviewInputSchema)
  .output(securityOverviewSchema)
  .query(async ({ input, ctx }) => {
    if (!isDefectDojoConfigured(process.env)) {
      return { state: "notConfigured" };
    }

    const [facts, part] = await Promise.all([
      loadPlatformFacts(ctx.session, input.namespace),
      loadRuntimePart(createDefectDojoClient(), input.state),
    ]);
    return toSecurityOverview(facts, part, input.namespace);
  });
