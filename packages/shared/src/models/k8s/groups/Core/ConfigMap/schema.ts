import { z } from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common";

const stringDictSchema = z.record(z.string());

export const configMapSchema = kubeObjectBaseSchema.extend({
  kind: z.literal("ConfigMap"),
  apiVersion: z.literal("v1"),
  metadata: kubeObjectMetadataSchema,
  data: stringDictSchema.optional(),
});

export const configMapDraftSchema = kubeObjectBaseDraftSchema.extend({
  kind: z.literal("ConfigMap"),
  apiVersion: z.literal("v1"),
  data: stringDictSchema.optional(),
});
