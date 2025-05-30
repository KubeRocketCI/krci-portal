import { ZodError } from "zod";
import { codebaseBranchSchema } from "../../schema";
import { CodebaseBranch } from "../../types";
import { editCodebaseBranchInputSchema } from "./schema";
import { EditCodebaseBranchInput } from "./types";

export const editCodebaseBranchObject = (
  codebaseBranch: CodebaseBranch,
  input: EditCodebaseBranchInput
): CodebaseBranch => {
  const parsedInput = editCodebaseBranchInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft = structuredClone(codebaseBranch);
  draft.spec.pipelines = input.pipelines;

  const parsedDraft = codebaseBranchSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
