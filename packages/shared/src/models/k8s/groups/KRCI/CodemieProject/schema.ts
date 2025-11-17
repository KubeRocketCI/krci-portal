import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema } from "../../../common/index.js";

const codemieRefSchema = z.object({
  kind: z.string().default("Codemie").optional(),
  name: z.string(),
});

export const codemieProjectSpecSchema = z.object({
  codemieRef: codemieRefSchema,
  name: z.string(),
});

export const codemieProjectStatusSchema = z.object({
  error: z.string().optional(),
  value: z.string().optional(),
});

export const codemieProjectSchema = kubeObjectBaseSchema
  .extend({
    spec: codemieProjectSpecSchema,
    status: codemieProjectStatusSchema.optional(),
  })
  .required();

export const codemieProjectDraftSchema = kubeObjectBaseDraftSchema.extend({
  spec: codemieProjectSpecSchema,
});
