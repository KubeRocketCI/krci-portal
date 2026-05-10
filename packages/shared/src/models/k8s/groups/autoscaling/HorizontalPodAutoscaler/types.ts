import z from "zod";
import { horizontalPodAutoscalerDraftSchema, horizontalPodAutoscalerSchema } from "./schema.js";

export type HorizontalPodAutoscaler = z.infer<typeof horizontalPodAutoscalerSchema>;
export type HorizontalPodAutoscalerDraft = z.infer<typeof horizontalPodAutoscalerDraftSchema>;
