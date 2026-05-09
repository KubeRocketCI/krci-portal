import z from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";
import { triggerSpecSchema } from "../Trigger/schema.js";
import { eventListenerLabels } from "./labels.js";

const eventListenerLabelsSchema = z.object({
  [eventListenerLabels.gitServer]: z.string().optional(),
});

const eventListenerSpecSchema = z
  .object({
    triggers: z.array(triggerSpecSchema).optional(),
  })
  .catchall(z.any());

const eventListenerStatusConditionSchema = z
  .object({
    type: z.string(),
    status: z.string(),
  })
  .catchall(z.any());

const eventListenerStatusSchema = z
  .object({
    address: z
      .object({
        url: z.string().optional(),
      })
      .catchall(z.any())
      .optional(),
    conditions: z.array(eventListenerStatusConditionSchema).optional(),
  })
  .catchall(z.any());

export const eventListenerSchema = kubeObjectBaseSchema
  .extend({
    metadata: kubeObjectMetadataSchema.extend({
      labels: eventListenerLabelsSchema.optional(),
    }),
    spec: eventListenerSpecSchema.optional(),
    status: eventListenerStatusSchema.optional(),
  })
  .catchall(z.any());
