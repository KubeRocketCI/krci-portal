import z from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema } from "../../../common/index.js";

export const applicationHealthStatusSchema = z.enum([
  "healthy",
  "progressing",
  "degraded",
  "suspended",
  "missing",
  "unknown",
]);
export const applicationSyncStatusSchema = z.enum(["synced", "outofsync"]);

export const applicationSchema = kubeObjectBaseSchema.extend({}).catchall(z.any());

export const applicationDraftSchema = kubeObjectBaseDraftSchema.extend({}).catchall(z.any());
