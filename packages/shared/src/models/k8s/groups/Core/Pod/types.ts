import z from "zod";
import { podDraftSchema, podSchema } from "./schema";

export type Pod = z.infer<typeof podSchema>;
export type PodDraft = z.infer<typeof podDraftSchema>;

// Convenience types for components
export type Container = Pod["spec"]["containers"][0];
export type ContainerStatus = NonNullable<Pod["status"]>["containerStatuses"] extends (infer T)[] ? T : never;
