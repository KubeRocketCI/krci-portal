import z from "zod";
import { jobDraftSchema, jobSchema } from "./schema.js";

export type Job = z.infer<typeof jobSchema>;
export type JobDraft = z.infer<typeof jobDraftSchema>;
