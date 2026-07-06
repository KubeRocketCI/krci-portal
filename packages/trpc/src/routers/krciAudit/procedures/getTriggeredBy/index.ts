import { z } from "zod";
import type { TriggeredBy } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createKrciAuditClient } from "../../../../clients/krciAudit/index.js";
import { classifyTriggeredByActor } from "./utils.js";

// Looked up by kind+namespace+name so Tekton Results history runs resolve too (see getInitiator).
const PIPELINE_RUN_KIND = "PipelineRun";

export const getTriggeredByProcedure = protectedProcedure
  .input(
    z.object({
      namespace: z.string().min(1),
      name: z.string().min(1),
    })
  )
  .query(async ({ input }): Promise<TriggeredBy> => {
    // krci-audit being unavailable or unconfigured must degrade the field to the
    // "N/A" placeholder, never fail the PipelineRun details page.
    try {
      const client = createKrciAuditClient();
      const initiator = await client.getInitiator({
        kind: PIPELINE_RUN_KIND,
        namespace: input.namespace,
        name: input.name,
      });
      return classifyTriggeredByActor(initiator);
    } catch (error) {
      console.error(`[krciAudit] getTriggeredBy failed for ${input.namespace}/${input.name}:`, error);
      return { actorClass: "unknown", degraded: true };
    }
  });
