import z from "zod";
import { gatewayDraftSchema, gatewaySchema } from "./schema.js";

export type Gateway = z.infer<typeof gatewaySchema>;
export type GatewayDraft = z.infer<typeof gatewayDraftSchema>;
