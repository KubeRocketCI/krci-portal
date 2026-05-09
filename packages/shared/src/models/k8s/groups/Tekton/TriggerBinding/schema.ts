import z from "zod";
import { kubeObjectBaseSchema } from "../../../common/index.js";

export const triggerBindingParamSchema = z
  .object({
    name: z.string(),
    value: z.unknown(),
  })
  .catchall(z.any());

export const triggerBindingSpecSchema = z
  .object({
    params: z.array(triggerBindingParamSchema).optional(),
  })
  .catchall(z.any());

export const triggerBindingSchema = kubeObjectBaseSchema
  .extend({
    spec: triggerBindingSpecSchema.optional(),
  })
  .catchall(z.any());
