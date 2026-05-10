import z from "zod";
import { namespaceDraftSchema, namespaceSchema } from "./schema.js";

export type Namespace = z.infer<typeof namespaceSchema>;
export type NamespaceDraft = z.infer<typeof namespaceDraftSchema>;
