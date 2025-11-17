import z from "zod";
import { tenantSchema, tenantDraftSchema } from "./schema.js";

export type Tenant = z.infer<typeof tenantSchema>;
export type TenantDraft = z.infer<typeof tenantDraftSchema>;
