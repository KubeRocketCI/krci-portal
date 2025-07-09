import z from "zod";
import { applicationDraftSchema, applicationSchema } from ".";

export type Application = z.infer<typeof applicationSchema>;
export type ApplicationDraft = z.infer<typeof applicationDraftSchema>;
