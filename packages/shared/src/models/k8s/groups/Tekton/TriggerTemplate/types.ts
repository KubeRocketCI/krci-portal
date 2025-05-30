import z from "zod";
import { triggerTemplateDraftSchema, triggerTemplateSchema } from ".";

export type TriggerTemplate = z.infer<typeof triggerTemplateSchema>;
export type TriggerTemplateDraft = z.infer<typeof triggerTemplateDraftSchema>;
