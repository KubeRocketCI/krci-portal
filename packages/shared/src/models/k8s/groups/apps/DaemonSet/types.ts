import z from "zod";
import { daemonSetDraftSchema, daemonSetSchema } from "./schema.js";

export type DaemonSet = z.infer<typeof daemonSetSchema>;
export type DaemonSetDraft = z.infer<typeof daemonSetDraftSchema>;
