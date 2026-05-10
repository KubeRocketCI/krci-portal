import z from "zod";
import { statefulSetDraftSchema, statefulSetSchema } from "./schema.js";

export type StatefulSet = z.infer<typeof statefulSetSchema>;
export type StatefulSetDraft = z.infer<typeof statefulSetDraftSchema>;
