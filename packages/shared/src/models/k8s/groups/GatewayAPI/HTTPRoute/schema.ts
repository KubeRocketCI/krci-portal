import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

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

export const httpRouteSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("HTTPRoute"),
  apiVersion: z.literal("gateway.networking.k8s.io/v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      hostnames: z.array(z.string()).optional(),
      parentRefs: z
        .array(
          z
            .object({
              group: z.string().optional(),
              kind: z.string().optional(),
              name: z.string(),
              namespace: z.string().optional(),
              sectionName: z.string().optional(),
              port: z.number().optional(),
            })
            .passthrough()
        )
        .optional(),
      rules: z
        .array(
          z
            .object({
              matches: z.array(z.object({}).passthrough()).optional(),
              filters: z.array(z.object({}).passthrough()).optional(),
              backendRefs: z
                .array(
                  z
                    .object({
                      group: z.string().optional(),
                      kind: z.string().optional(),
                      name: z.string(),
                      port: z.number().optional(),
                      weight: z.number().optional(),
                    })
                    .passthrough()
                )
                .optional(),
            })
            .passthrough()
        )
        .optional(),
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      parents: z
        .array(
          z
            .object({
              parentRef: z.object({}).passthrough().optional(),
              controllerName: z.string().optional(),
              conditions: z.array(conditionSchema).optional(),
            })
            .passthrough()
        )
        .optional(),
    })
    .passthrough()
    .optional(),
});

export const httpRouteDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("HTTPRoute"),
  apiVersion: z.literal("gateway.networking.k8s.io/v1"),
  spec: z.object({}).passthrough().optional(),
});
