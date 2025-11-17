import z from "zod";
import {
  codemieDraftSchema,
  codemieDraftSecretSchema,
  codemieSchema,
  codemieSecretSchema,
  createCodemieDraftInputSchema,
  createCodemieDraftSecretInputSchema,
} from "./schema.js";

export type Codemie = z.infer<typeof codemieSchema>;
export type CodemieDraft = z.infer<typeof codemieDraftSchema>;
export type CreateCodemieDraftInput = z.infer<typeof createCodemieDraftInputSchema>;

export type CodemieSecret = z.infer<typeof codemieSecretSchema>;
export type CodemieDraftSecret = z.infer<typeof codemieDraftSecretSchema>;
export type CreateCodemieDraftSecretInput = z.infer<typeof createCodemieDraftSecretInputSchema>;
