import z from "zod";
import { clientTrafficPolicyDraftSchema, clientTrafficPolicySchema } from "./schema.js";

export type ClientTrafficPolicy = z.infer<typeof clientTrafficPolicySchema>;
export type ClientTrafficPolicyDraft = z.infer<typeof clientTrafficPolicyDraftSchema>;
