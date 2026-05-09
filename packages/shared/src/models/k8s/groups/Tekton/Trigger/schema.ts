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
    interceptors: z.array(triggerInterceptorSchema).optional(),
    bindings: z.array(triggerBindingRefSchema).optional(),
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
