import { z } from "zod";

/** Runtime guard for krci-audit's `GET /api/v1/audit/initiator` response, so a schema drift
 *  on krci-audit's side fails loudly (and degrades to "N/A") instead of silently misclassifying. */
export const krciAuditInitiatorSchema = z.object({
  found: z.boolean(),
  actor: z.string().optional(),
  operation: z.enum(["CREATE", "UPDATE", "DELETE", "CONNECT"]).optional(),
  timestamp: z.string().optional(),
});
