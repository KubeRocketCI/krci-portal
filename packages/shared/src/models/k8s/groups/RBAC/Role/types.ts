import z from "zod";
import { roleDraftSchema, roleSchema } from "./schema.js";

export type Role = z.infer<typeof roleSchema>;
export type RoleDraft = z.infer<typeof roleDraftSchema>;
