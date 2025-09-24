import z from "zod";
import { kubeObjectBaseSchema } from "../../../common";

export const codebaseImageStreamTagSchema = z.object({
  created: z.string(),
  name: z.string(),
});

export const codebaseImageStreamSpecSchema = z.object({
  codebase: z.string(),
  imageName: z.string(),
  tags: z.array(codebaseImageStreamTagSchema).nullable().optional(),
});

export const codebaseImageStreamStatusSchema = z.object({
  detailed_message: z.string().optional(),
  failureCount: z.number().int(),
});

export const codebaseImageStreamSchema = kubeObjectBaseSchema
  .extend({
    spec: codebaseImageStreamSpecSchema,
    status: codebaseImageStreamStatusSchema.optional(),
  })
  .required();
