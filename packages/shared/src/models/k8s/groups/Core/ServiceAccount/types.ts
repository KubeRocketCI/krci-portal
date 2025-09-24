import z from "zod";
import { serviceAccountDraftSchema, serviceAccountSchema } from "./schema";

export type ServiceAccount = z.infer<typeof serviceAccountSchema>;
export type ServiceAccountDraft = z.infer<typeof serviceAccountDraftSchema>;
