import z from "zod";
import { configMapDraftSchema, configMapSchema } from "./schema.js";

export type ConfigMap = z.infer<typeof configMapSchema>;
export type ConfigMapDraft = z.infer<typeof configMapDraftSchema>;
