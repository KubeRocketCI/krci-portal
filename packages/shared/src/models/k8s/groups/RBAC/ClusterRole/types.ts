import z from "zod";
import { clusterRoleDraftSchema, clusterRoleSchema } from "./schema.js";

export type ClusterRole = z.infer<typeof clusterRoleSchema>;
export type ClusterRoleDraft = z.infer<typeof clusterRoleDraftSchema>;
