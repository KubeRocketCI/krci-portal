import z from "zod";
import { codebaseBranchDraftSchema, codebaseBranchSchema } from "./schema";

export type CodebaseBranch = z.infer<typeof codebaseBranchSchema>;
export type CodebaseBranchDraft = z.infer<typeof codebaseBranchDraftSchema>;
