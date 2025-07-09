import z from "zod";
import { kubeObjectBaseDraftSchema, kubeObjectBaseSchema } from "../../../core";

export const applicationSchema = kubeObjectBaseSchema
  .extend({})
  .catchall(z.any());

export const applicationDraftSchema = kubeObjectBaseDraftSchema
  .extend({})
  .catchall(z.any());
