import { z } from "zod";

export const actorDetailTabEnum = z.enum(["summary", "runtime", "snapshot"]);

export type ActorDetailTab = z.infer<typeof actorDetailTabEnum>;

export const actorDetailTabSchema = z.object({
  tab: actorDetailTabEnum.optional().catch(undefined),
});

export type ActorDetailSearch = z.infer<typeof actorDetailTabSchema>;

export const agentDetailViewEnum = z.enum(["sections", "diagram"]);

export type AgentDetailViewKind = z.infer<typeof agentDetailViewEnum>;

export const agentDetailViewSchema = z.object({
  view: agentDetailViewEnum.optional().catch(undefined),
});
