import { z } from "zod";

export const baseDetailTabSchema = z.object({
  tab: z.enum(["overview", "yaml", "events"]).optional(),
});

export const podDetailTabSchema = z.object({
  tab: z.enum(["overview", "containers", "yaml", "events", "conditions", "volumes", "logs", "shell"]).optional(),
  container: z.string().optional(),
});

export const nodeDetailTabSchema = z.object({
  tab: z.enum(["overview", "yaml", "events", "conditions", "charts"]).optional(),
});

export const rbacOverviewTabSchema = z.object({
  tab: z.enum(["roles", "rolebindings", "clusterroles", "clusterrolebindings"]).optional(),
});

export type BaseDetailSearch = z.infer<typeof baseDetailTabSchema>;
export type PodDetailSearch = z.infer<typeof podDetailTabSchema>;
export type NodeDetailSearch = z.infer<typeof nodeDetailTabSchema>;
export type RbacOverviewSearch = z.infer<typeof rbacOverviewTabSchema>;
