import { z } from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

const conditionSchema = z
  .object({
    type: z.string(),
    status: z.string(),
    reason: z.string().optional(),
    message: z.string().optional(),
    lastTransitionTime: z.string().optional(),
    observedGeneration: z.number().optional(),
  })
  .passthrough();

/** Read only: Agent Substrate owns `WorkerPool` objects. */
export const workerPoolSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("WorkerPool"),
  apiVersion: z.literal("ate.dev/v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      replicas: z.number().optional(),
      sandboxClasses: z.array(z.object({ name: z.string() }).passthrough()).optional(),
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      replicas: z.number().optional(),
      readyReplicas: z.number().optional(),
      sandboxClasses: z
        .array(
          z
            .object({
              name: z.string().optional(),
              conditions: z.array(conditionSchema).optional(),
            })
            .passthrough()
        )
        .optional(),
    })
    .passthrough()
    .optional(),
});
