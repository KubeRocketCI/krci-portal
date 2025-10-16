import z from "zod";
import { resourceQuotaSchema, resourceQuotaDraftSchema } from "./schema";

export type ResourceQuota = z.infer<typeof resourceQuotaSchema>;
export type ResourceQuotaDraft = z.infer<typeof resourceQuotaDraftSchema>;
