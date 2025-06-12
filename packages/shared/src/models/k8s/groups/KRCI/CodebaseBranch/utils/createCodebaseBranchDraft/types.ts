import z from "zod";
import { createCodebaseBranchDraftInputSchema } from "./schema";

export type CreateCodebaseBranchDraftInput = z.infer<
  typeof createCodebaseBranchDraftInputSchema
>;
