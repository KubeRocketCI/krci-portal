import z from "zod";
import { triggerSchema } from "./schema.js";

export type Trigger = z.infer<typeof triggerSchema>;
