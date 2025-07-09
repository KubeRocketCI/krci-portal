import z from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema } from "../../../core";

export const systemQuickLinksEnum = z.enum([
  "argocd",
  "defectdojo",
  "dependency-track",
  "monitoring",
  "logging",
  "nexus",
  "sonar",
  "codemie",
]);

export const quickLinkTypeEnum = z.enum(["default", "system"]);

const quickLinkSpecSchema = z.object({
  icon: z.string(),
  type: quickLinkTypeEnum,
  url: z.string(),
  visible: z.boolean(),
});

export const quickLinkSchema = kubeObjectBaseSchema.extend({
  spec: quickLinkSpecSchema,
});

export const quickLinkDraftSchema = kubeObjectBaseDraftSchema.extend({
  spec: quickLinkSpecSchema,
});

export const createQuickLinkDraftInputSchema = z.object({
  name: z.string(),
  icon: z.string(),
  url: z.string(),
  visible: z.boolean(),
});

export const editQuickLinkInputSchema = z.object({
  url: z.string(),
  visible: z.boolean(),
  icon: z.string(),
});
