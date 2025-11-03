import z from "zod";
import { kubeObjectBaseSchema } from "../../../common";

const IconSchema = z.object({
  base64data: z.string(),
  mediatype: z.string(),
});

const MaintainerSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

const templateSpecSchema = z.object({
  buildTool: z.string(),
  category: z.string().optional(),
  description: z.string(),
  displayName: z.string(),
  framework: z.string(),
  icon: z.array(IconSchema).max(1).optional(),
  keywords: z.array(z.string()).optional(),
  language: z.string(),
  maintainers: z.array(MaintainerSchema).optional(),
  maturity: z.enum(["planning", "pre-alpha", "alpha", "beta", "stable", "mature", "inactive", "deprecated"]).optional(),
  minEDPVersion: z.string().optional(),
  source: z.string(),
  type: z.string(),
  version: z.string(),
});

export const templateSchema = kubeObjectBaseSchema.extend({
  spec: templateSpecSchema,
});
