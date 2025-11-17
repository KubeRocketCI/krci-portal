import z from "zod";
import { codemieApplicationDraftSchema, codemieApplicationSchema, codemieApplicationStatusEnum } from "./schema.js";

export type CodemieApplication = z.infer<typeof codemieApplicationSchema>;
export type CodemieApplicationDraft = z.infer<typeof codemieApplicationDraftSchema>;

export type CodemieApplicationStatus = z.infer<typeof codemieApplicationStatusEnum>;
