import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

const ingressBackendSchema = z
  .object({
    service: z
      .object({
        name: z.string().optional(),
        port: z.object({ number: z.number().optional(), name: z.string().optional() }).passthrough().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const ingressRuleSchema = z
  .object({
    host: z.string().optional(),
    http: z
      .object({
        paths: z.array(
          z
            .object({
              path: z.string().optional(),
              pathType: z.string().optional(),
              backend: ingressBackendSchema,
            })
            .passthrough()
        ),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const ingressSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("Ingress"),
  apiVersion: z.literal("networking.k8s.io/v1"),
  metadata: kubeObjectMetadataSchema,
  spec: z
    .object({
      ingressClassName: z.string().optional(),
      rules: z.array(ingressRuleSchema).optional(),
      tls: z.array(z.object({}).passthrough()).optional(),
    })
    .passthrough()
    .optional(),
  status: z
    .object({
      loadBalancer: z
        .object({
          ingress: z.array(z.object({}).passthrough()).optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough()
    .optional(),
});

export const ingressDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("Ingress"),
  apiVersion: z.literal("networking.k8s.io/v1"),
  spec: z.object({}).passthrough().optional(),
});
