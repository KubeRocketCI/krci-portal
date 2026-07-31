import z from "zod";
import { kubeObjectBaseSchema } from "../../../common/index.js";

const triggerInterceptorSchema = z
  .object({
    ref: z
      .object({
        name: z.string().optional(),
        kind: z.string().optional(),
      })
      .catchall(z.any())
      .optional(),
    params: z
      .array(
        z
          .object({
            name: z.string(),
            value: z.unknown(),
          })
          .catchall(z.any())
      )
      .optional(),
  })
  .catchall(z.any());

const triggerBindingRefSchema = z
  .object({
    ref: z.string().optional(),
    kind: z.string().optional(),
  })
  .catchall(z.any());

export const triggerSpecSchema = z
  .object({
    name: z.string().optional(),
    // Tekton persists these as explicit `null` (not absent) when a Trigger
    // declares neither, so they must be nullish rather than merely optional.
    interceptors: z.array(triggerInterceptorSchema).nullish(),
    bindings: z.array(triggerBindingRefSchema).nullish(),
    template: z
      .object({
        ref: z.string().optional(),
      })
      .catchall(z.any())
      .optional(),
    triggerRef: z.string().optional(),
  })
  .catchall(z.any());

export const triggerSchema = kubeObjectBaseSchema
  .extend({
    spec: triggerSpecSchema.optional(),
  })
  .catchall(z.any());
