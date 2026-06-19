import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

const policyTargetRefSchema = z
  .object({
    group: z.string(),
    kind: z.string(),
    name: z.string(),
    sectionName: z.string().optional(),
  })
  .passthrough();

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

export const backendTrafficPolicySchema = kubeObjectBaseSchema.extend({
  kind: z.literal("BackendTrafficPolicy"),
  apiVersion: z.literal("gateway.envoyproxy.io/v1alpha1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      targetRef: policyTargetRefSchema.optional(),
      targetRefs: z.array(policyTargetRefSchema).optional(),
      targetSelectors: z.array(z.object({}).passthrough()).optional(),
      rateLimit: z.object({}).passthrough().optional(),
      loadBalancer: z.object({}).passthrough().optional(),
      retry: z.object({}).passthrough().optional(),
      timeout: z.object({}).passthrough().optional(),
      circuitBreaker: z.object({}).passthrough().optional(),
      healthCheck: z.object({}).passthrough().optional(),
      faultInjection: z.object({}).passthrough().optional(),
      connection: z.object({}).passthrough().optional(),
      proxyProtocol: z.object({}).passthrough().optional(),
      tcpKeepalive: z.object({}).passthrough().optional(),
      http2: z.object({}).passthrough().optional(),
      useClientProtocol: z.boolean().optional(),
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      ancestors: z
        .array(
          z
            .object({
              ancestorRef: z.object({}).passthrough().optional(),
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

export const backendTrafficPolicyDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("BackendTrafficPolicy"),
  apiVersion: z.literal("gateway.envoyproxy.io/v1alpha1"),
  spec: z.object({}).passthrough().optional(),
});
