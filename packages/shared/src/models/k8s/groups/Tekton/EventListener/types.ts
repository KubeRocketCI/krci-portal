import z from "zod";
import { eventListenerSchema } from "./schema.js";

export type EventListener = z.infer<typeof eventListenerSchema>;
