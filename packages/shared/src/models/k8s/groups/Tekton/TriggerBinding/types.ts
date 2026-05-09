import z from "zod";
import { triggerBindingSchema } from "./schema.js";

export type TriggerBinding = z.infer<typeof triggerBindingSchema>;
