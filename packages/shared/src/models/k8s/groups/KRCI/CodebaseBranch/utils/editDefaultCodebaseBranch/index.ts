import { ZodError } from "zod";
import { CodebaseBranch } from "../../types.js";
import { editDefaultCodebaseBranchInputSchema } from "./schema.js";
import { EditDefaultCodebaseBranchInput } from "./types.js";
import { codebaseBranchSchema } from "../../schema.js";

export const editDefaultCodebaseBranchObject = (
  defaultBranch: CodebaseBranch,
  input: EditDefaultCodebaseBranchInput
): CodebaseBranch => {
  const parsedInput = editDefaultCodebaseBranchInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft = structuredClone(defaultBranch);
  draft.spec.version = input.version;

  const parsedDraft = codebaseBranchSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
