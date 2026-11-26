import { securityOverviewCodebasesInputSchema, securityOverviewCodebasesSchema } from "@my-project/shared";
import { createDefectDojoClient, isDefectDojoConfigured } from "../../../../clients/defectDojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { loadCodebasesPart, toSecurityOverviewCodebases } from "../../securityOverview/codebases.js";
import { loadTenantFacts } from "../../securityOverview/tenantFacts.js";

/**
 * The Code and Image part of the Security overview: the scans of the tenant's CI tests by codebase, and the Codebases
 * without scan data. DefectDojo is read once per `SECURITY_OVERVIEW_CACHE_TTL_MS` for every caller; the Codebases,
 * their branches and image streams are read with the signed-in user's access.
 */
export const getSecurityOverviewCodebasesProcedure = protectedProcedure
  .input(securityOverviewCodebasesInputSchema)
  .output(securityOverviewCodebasesSchema)
  .query(async ({ input, ctx }) => {
    if (!isDefectDojoConfigured(process.env)) {
      return { state: "notConfigured" };
    }

    const [facts, part] = await Promise.all([
      loadTenantFacts(ctx.session, input.namespace),
      loadCodebasesPart(createDefectDojoClient(), input.namespace, input.state),
    ]);
    return toSecurityOverviewCodebases(facts, part);
  });
