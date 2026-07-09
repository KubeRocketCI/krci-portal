import { z } from "zod";
import type { KrciAuditFacetField, KrciAuditFacetsResponse } from "@my-project/shared";
import { adminProcedure } from "../../../../procedures/authorized/index.js";
import { createKrciAuditClient } from "../../../../clients/krciAudit/index.js";

const auditFacetFieldSchema = z.enum(["namespace", "kind", "actor"]);

// `operation` is deliberately excluded: it's a fixed 4-value enum the client already has,
// not a value krci-audit needs to compute distinct values for.
const DEFAULT_FACET_FIELDS: KrciAuditFacetField[] = ["namespace", "kind", "actor"];

export const getAuditFacetsInputSchema = z.object({
  fields: z.array(auditFacetFieldSchema).optional(),
});

export const getAuditFacetsProcedure = adminProcedure
  .input(getAuditFacetsInputSchema)
  .query(async ({ input }): Promise<KrciAuditFacetsResponse> => {
    const client = createKrciAuditClient();

    return client.getFacets(input.fields ?? DEFAULT_FACET_FIELDS);
  });
