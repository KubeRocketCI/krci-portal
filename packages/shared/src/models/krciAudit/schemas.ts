import { z } from "zod";

const krciAuditOperationSchema = z.enum(["CREATE", "UPDATE", "DELETE", "CONNECT"]);

/** Runtime guard for krci-audit's `GET /api/v1/audit/initiator` response, so a schema drift
 *  on krci-audit's side fails loudly (and degrades to "N/A") instead of silently misclassifying. */
export const krciAuditInitiatorSchema = z.object({
  found: z.boolean(),
  actor: z.string().optional(),
  operation: krciAuditOperationSchema.optional(),
  timestamp: z.string().optional(),
});

export const krciAuditEventSchema = z.object({
  eventUid: z.string(),
  receivedAt: z.string(),
  operation: krciAuditOperationSchema,
  apiGroup: z.string(),
  apiVersion: z.string(),
  resource: z.string(),
  kind: z.string(),
  subResource: z.string().nullable().optional(),
  namespace: z.string(),
  name: z.string(),
  objectUid: z.string().nullable().optional(),
  username: z.string(),
  dryRun: z.boolean(),
});

export const krciAuditEventsResponseSchema = z.object({
  data: z.array(krciAuditEventSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
  }),
});

/** Runtime guard for krci-audit's `Facet` schema: `{values, truncated}` (both required). */
export const krciAuditFacetSchema = z.object({
  values: z.array(z.string()),
  truncated: z.boolean(),
});

export const krciAuditFacetsResponseSchema = z.object({
  namespace: krciAuditFacetSchema.optional(),
  kind: krciAuditFacetSchema.optional(),
  actor: krciAuditFacetSchema.optional(),
});
