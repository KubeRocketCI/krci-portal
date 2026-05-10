import z from "zod";
import { deploymentDraftSchema, deploymentSchema } from "./schema.js";

export type Deployment = z.infer<typeof deploymentSchema>;
export type DeploymentDraft = z.infer<typeof deploymentDraftSchema>;
