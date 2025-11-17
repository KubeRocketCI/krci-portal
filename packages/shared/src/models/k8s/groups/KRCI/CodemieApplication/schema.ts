import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema } from "../../../common/index.js";

const codemieApplicationCodeConfigSchema = z.object({
  branch: z.string().default("main").optional(),
  embeddingsModel: z.string(),
  fileRegex: z.string().optional(),
  fileTypes: z.array(z.string()).nullable().optional(),
  link: z.string(),
});

const codemieApplicationPromptsSchema = z.object({
  name: z.string(),
  template: z.string(),
});

const codemieApplicationSummaryConfigSchema = z.object({
  generateDocs: z.boolean().default(false).optional(),
  prompts: z.array(codemieApplicationPromptsSchema).nullable().optional(),
});

const codemieRefSchema = z.object({
  kind: z.string().default("Codemie").optional(),
  name: z.string(),
});

export const codemieApplicationSpecSchema = z.object({
  applicationCodeConfig: codemieApplicationCodeConfigSchema,
  applicationSummaryConfig: codemieApplicationSummaryConfigSchema.optional(),
  codemieRef: codemieRefSchema,
  description: z.string().optional(),
  indexType: z.enum(["code", "chunk-summary", "summary"]),
  name: z.string(),
  projectName: z.string(),
  projectSpaceVisible: z.boolean().default(true).optional(),
});

export const codemieApplicationStatusEnum = z.enum(["created", "error"]);

export const codemieApplicationStatusSchema = z.object({
  application: z.string().optional(),
  error: z.string().optional(),
  id: z.string().optional(),
  value: codemieApplicationStatusEnum.optional(),
});

export const codemieApplicationSchema = kubeObjectBaseSchema
  .extend({
    spec: codemieApplicationSpecSchema,
    status: codemieApplicationStatusSchema.optional(),
  })
  .required();

export const codemieApplicationDraftSchema = kubeObjectBaseDraftSchema.extend({
  spec: codemieApplicationSpecSchema,
});
