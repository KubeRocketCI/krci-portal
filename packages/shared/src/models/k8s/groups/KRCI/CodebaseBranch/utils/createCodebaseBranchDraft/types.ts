import z from "zod";
import { createCodebaseBranchDraftInputSchema } from "./schema.js";

export type CreateCodebaseBranchDraftInput = z.infer<typeof createCodebaseBranchDraftInputSchema>;
