import { z } from "zod";

export const actorDetailTabEnum = z.enum(["summary", "runtime", "snapshot"]);

export type ActorDetailTab = z.infer<typeof actorDetailTabEnum>;

export const actorDetailTabSchema = z.object({
  tab: actorDetailTabEnum.optional().catch(undefined),
});

export type ActorDetailSearch = z.infer<typeof actorDetailTabSchema>;
