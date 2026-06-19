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

export const gatewaySchema = kubeObjectBaseSchema.extend({
  kind: z.literal("Gateway"),
  apiVersion: z.literal("gateway.networking.k8s.io/v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      gatewayClassName: z.string(),
      listeners: z.array(
        z
          .object({
            name: z.string(),
            port: z.number(),
            protocol: z.string(),
            hostname: z.string().optional(),
            allowedRoutes: z.object({}).passthrough().optional(),
            tls: z.object({}).passthrough().optional(),
          })
          .passthrough()
      ),
      addresses: z.array(z.object({ type: z.string().optional(), value: z.string() }).passthrough()).optional(),
      infrastructure: z.object({}).passthrough().optional(),
      allowedListeners: z.object({}).passthrough().optional(),
      backendTLS: z.object({}).passthrough().optional(),
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      addresses: z.array(z.object({ type: z.string().optional(), value: z.string() }).passthrough()).optional(),
      conditions: z.array(conditionSchema).optional(),
      listeners: z
        .array(
          z
            .object({
              name: z.string().optional(),
              attachedRoutes: z.number().optional(),
              conditions: z.array(conditionSchema).optional(),
              supportedKinds: z.array(z.object({}).passthrough()).optional(),
            })
            .passthrough()
        )
        .optional(),
    })
    .passthrough()
    .optional(),
});

export const gatewayDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("Gateway"),
  apiVersion: z.literal("gateway.networking.k8s.io/v1"),
  spec: z.object({}).passthrough().optional(),
});
