import z from "zod";
import { triggerTemplateDraftSchema, triggerTemplateSchema } from "./index.js";

export type TriggerTemplate = z.infer<typeof triggerTemplateSchema>;
export type TriggerTemplateDraft = z.infer<typeof triggerTemplateDraftSchema>;
