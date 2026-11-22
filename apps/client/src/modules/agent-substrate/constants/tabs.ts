import { z } from "zod";

export const actorDetailTabSchema = z.object({
  tab: z.enum(["summary", "runtime", "snapshot"]).optional(),
});

export type ActorDetailSearch = z.infer<typeof actorDetailTabSchema>;
