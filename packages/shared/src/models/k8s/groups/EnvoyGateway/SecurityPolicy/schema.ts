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

const policyTargetRefSchema = z
  .object({
    group: z.string(),
    kind: z.string(),
    name: z.string(),
    sectionName: z.string().optional(),
  })
  .passthrough();

export const securityPolicySchema = kubeObjectBaseSchema.extend({
  kind: z.literal("SecurityPolicy"),
  apiVersion: z.literal("gateway.envoyproxy.io/v1alpha1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      targetRef: policyTargetRefSchema.optional(),
      targetRefs: z.array(policyTargetRefSchema).optional(),
      targetSelectors: z.array(z.object({}).passthrough()).optional(),
      cors: z.object({}).passthrough().optional(),
      jwt: z.object({}).passthrough().optional(),
      oidc: z.object({}).passthrough().optional(),
      basicAuth: z.object({}).passthrough().optional(),
      apiKeyAuth: z.object({}).passthrough().optional(),
      extAuth: z.object({}).passthrough().optional(),
      authorization: z.object({}).passthrough().optional(),
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

export const securityPolicyDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("SecurityPolicy"),
  apiVersion: z.literal("gateway.envoyproxy.io/v1alpha1"),
  spec: z.object({}).passthrough().optional(),
});
