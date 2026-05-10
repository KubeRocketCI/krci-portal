import z from "zod";
import { cronJobDraftSchema, cronJobSchema } from "./schema.js";

export type CronJob = z.infer<typeof cronJobSchema>;
export type CronJobDraft = z.infer<typeof cronJobDraftSchema>;
