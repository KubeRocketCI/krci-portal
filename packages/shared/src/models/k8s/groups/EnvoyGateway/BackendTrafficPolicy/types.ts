import z from "zod";
import { backendTrafficPolicyDraftSchema, backendTrafficPolicySchema } from "./schema.js";

export type BackendTrafficPolicy = z.infer<typeof backendTrafficPolicySchema>;
export type BackendTrafficPolicyDraft = z.infer<typeof backendTrafficPolicyDraftSchema>;
