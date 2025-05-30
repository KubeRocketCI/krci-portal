import z from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema } from "../../../core";

export const triggerTemplateSchema = kubeObjectBaseSchema
  .extend({})
  .catchall(z.any());

export const triggerTemplateDraftSchema = kubeObjectBaseDraftSchema
  .extend({})
  .catchall(z.any());
