import z from "zod";
import {
  applicationDraftSchema,
  applicationHealthStatusSchema,
  applicationSchema,
  applicationSyncStatusSchema,
} from ".";

export type Application = z.infer<typeof applicationSchema>;
export type ApplicationDraft = z.infer<typeof applicationDraftSchema>;

export type ApplicationHealthStatus = z.infer<
  typeof applicationHealthStatusSchema
>;
export type ApplicationSyncStatus = z.infer<typeof applicationSyncStatusSchema>;
