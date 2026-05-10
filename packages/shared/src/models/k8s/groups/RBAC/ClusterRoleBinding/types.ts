import z from "zod";
import { clusterRoleBindingDraftSchema, clusterRoleBindingSchema } from "./schema.js";

export type ClusterRoleBinding = z.infer<typeof clusterRoleBindingSchema>;
export type ClusterRoleBindingDraft = z.infer<typeof clusterRoleBindingDraftSchema>;
