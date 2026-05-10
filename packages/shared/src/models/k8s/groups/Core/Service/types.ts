import z from "zod";
import { serviceDraftSchema, serviceSchema } from "./schema.js";

export type Service = z.infer<typeof serviceSchema>;
export type ServiceDraft = z.infer<typeof serviceDraftSchema>;
