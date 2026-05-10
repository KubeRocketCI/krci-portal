import z from "zod";
import { ingressDraftSchema, ingressSchema } from "./schema.js";

export type Ingress = z.infer<typeof ingressSchema>;
export type IngressDraft = z.infer<typeof ingressDraftSchema>;
