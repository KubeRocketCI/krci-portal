import z from "zod";
import { codemieProjectDraftSchema, codemieProjectSchema } from "./schema";

export type CodemieProject = z.infer<typeof codemieProjectSchema>;
export type CodemieProjectDraft = z.infer<typeof codemieProjectDraftSchema>;
