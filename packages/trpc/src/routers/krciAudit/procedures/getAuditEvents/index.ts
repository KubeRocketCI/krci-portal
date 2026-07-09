import { z } from "zod";
import type { KrciAuditEventsResponse } from "@my-project/shared";
import { adminProcedure } from "../../../../procedures/authorized/index.js";
import { createKrciAuditClient } from "../../../../clients/krciAudit/index.js";

const auditOperationSchema = z.enum(["CREATE", "UPDATE", "DELETE", "CONNECT"]);

export const getAuditEventsInputSchema = z.object({
  actor: z.string().optional(),
  operation: auditOperationSchema.optional(),
  kind: z.string().optional(),
  namespace: z.string().optional(),
  name: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.number().int().min(1).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
});

export const getAuditEventsProcedure = adminProcedure
  .input(getAuditEventsInputSchema)
  .query(async ({ input }): Promise<KrciAuditEventsResponse> => {
    const client = createKrciAuditClient();

    return client.getAuditEvents(input);
  });
