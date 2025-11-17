import z from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema } from "../../../common/index.js";

export const jiraServerStatusEnum = z.enum(["finished", "error"]);

const jiraServerSpecSchema = z.object({
  apiUrl: z.string().url(),
  credentialName: z.string(),
  rootUrl: z.string().url(),
});

const jiraServerStatusSchema = z.object({
  available: z.boolean(),
  detailed_message: z.string().optional(),
  last_time_updated: z.string().datetime(),
  status: jiraServerStatusEnum,
});

export const jiraServerSchema = kubeObjectBaseSchema.extend({
  spec: jiraServerSpecSchema,
  status: jiraServerStatusSchema.optional(),
});

export const jiraServerDraftSchema = kubeObjectBaseDraftSchema.extend({
  spec: jiraServerSpecSchema,
});
