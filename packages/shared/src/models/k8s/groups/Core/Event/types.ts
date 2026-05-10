import z from "zod";
import { eventDraftSchema, eventSchema } from "./schema.js";

export type Event = z.infer<typeof eventSchema>;
export type EventDraft = z.infer<typeof eventDraftSchema>;
