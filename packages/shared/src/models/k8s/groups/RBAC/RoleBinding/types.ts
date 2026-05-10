import z from "zod";
import { roleBindingDraftSchema, roleBindingSchema } from "./schema.js";

export type RoleBinding = z.infer<typeof roleBindingSchema>;
export type RoleBindingDraft = z.infer<typeof roleBindingDraftSchema>;
