import z from "zod";
import { nodeDraftSchema, nodeSchema } from "./schema.js";

export type Node = z.infer<typeof nodeSchema>;
export type NodeDraft = z.infer<typeof nodeDraftSchema>;
