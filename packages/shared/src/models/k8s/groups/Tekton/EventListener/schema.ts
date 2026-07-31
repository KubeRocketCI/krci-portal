import z from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";
import { triggerSpecSchema } from "../Trigger/schema.js";
import { eventListenerLabels } from "./labels.js";

const eventListenerLabelsSchema = z.object({
  [eventListenerLabels.gitServer]: z.string().optional(),
});

// Loose on purpose: one EventListener with an unexpected shape here must not
// fail the parse of the whole list and blank the page. Consumers validate and
// degrade per entry instead — see the tekton labelSelector util.
const eventListenerLabelSelectorSchema = z
  .object({
    matchLabels: z.record(z.unknown()).optional(),
    matchExpressions: z.array(z.unknown()).optional(),
  })
  .catchall(z.any());

const eventListenerNamespaceSelectorSchema = z
  .object({
    matchNames: z.array(z.unknown()).optional(),
  })
  .catchall(z.any());

const eventListenerSpecSchema = z
  .object({
    triggers: z.array(triggerSpecSchema).nullish(),
    labelSelector: eventListenerLabelSelectorSchema.optional(),
    namespaceSelector: eventListenerNamespaceSelectorSchema.optional(),
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
