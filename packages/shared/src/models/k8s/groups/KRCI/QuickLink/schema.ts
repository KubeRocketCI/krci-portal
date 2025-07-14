import z from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectDraftMetadataSchema,
  kubeObjectMetadataSchema,
} from "../../../core";
import { krciCommonLabelsSchema } from "..";
import { quickLinkLabels } from "./labels";

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

const quickLinkLabelsSchema = krciCommonLabelsSchema.extend({
  [quickLinkLabels.provider]: z.string().optional(),
});

export const quickLinkSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema.extend({
    labels: quickLinkLabelsSchema,
  }),
  spec: quickLinkSpecSchema,
});

export const quickLinkDraftSchema = kubeObjectBaseDraftSchema.extend({
  metadata: kubeObjectDraftMetadataSchema.extend({
    labels: quickLinkLabelsSchema,
  }),
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
