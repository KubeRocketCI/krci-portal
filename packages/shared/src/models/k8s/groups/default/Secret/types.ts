import z from "zod";
import { secretDraftSchema, secretSchema } from "./schema";

export type Secret = z.infer<typeof secretSchema>;
export type SecretDraft = z.infer<typeof secretDraftSchema>;
