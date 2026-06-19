import z from "zod";
import { securityPolicyDraftSchema, securityPolicySchema } from "./schema.js";

export type SecurityPolicy = z.infer<typeof securityPolicySchema>;
export type SecurityPolicyDraft = z.infer<typeof securityPolicyDraftSchema>;
