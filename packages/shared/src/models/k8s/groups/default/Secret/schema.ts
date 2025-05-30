import { z } from "zod";
import {
  kubeObjectBaseDraftSchema,
  kubeObjectBaseSchema,
  kubeObjectMetadataSchema,
} from "../../../core";

const stringDictSchema = z.record(z.string());

const base64StringDictSchema = z.record(z.string());

export const secretSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("Secret"),
  apiVersion: z.literal("v1"),
  metadata: kubeObjectMetadataSchema,
  data: base64StringDictSchema.optional(),
  stringData: stringDictSchema.optional(),
  immutable: z.boolean().optional(),
  type: z.string().optional(),
});

export const secretDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("Secret"),
  apiVersion: z.literal("v1"),
  data: base64StringDictSchema.optional(),
  stringData: stringDictSchema.optional(),
  immutable: z.boolean().optional(),
  type: z.string().optional(),
});
