import { vulnerabilitiesInputSchema, vulnerabilitiesSchema } from "@my-project/shared";
import { createDefectDojoClient, isDefectDojoConfigured } from "../../../../clients/defectDojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { NO_PLATFORM_FACTS, loadPlatformFacts } from "../../platformFindings/facts.js";
import { readVulnerabilities } from "../../platformFindings/vulnerabilities.js";

export const getVulnerabilitiesProcedure = protectedProcedure
  .input(vulnerabilitiesInputSchema)
  .output(vulnerabilitiesSchema)
  .query(async ({ input, ctx }) => {
    if (!isDefectDojoConfigured(process.env)) {
      return { state: "notConfigured" };
    }

    const facts =
      input.level === "runtime"
        ? await loadPlatformFacts(ctx.session, input.namespace, { applications: true })
        : NO_PLATFORM_FACTS;
    return readVulnerabilities(createDefectDojoClient(), facts, input);
  });
