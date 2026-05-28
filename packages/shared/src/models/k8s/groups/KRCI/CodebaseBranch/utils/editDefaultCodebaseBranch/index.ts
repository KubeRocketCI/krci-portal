import { ZodError } from "zod";
import { CodebaseBranch } from "../../types.js";
import { editDefaultCodebaseBranchInputSchema } from "./schema.js";
import { EditDefaultCodebaseBranchInput } from "./types.js";

export const editDefaultCodebaseBranchObject = (
  defaultBranch: CodebaseBranch,
  input: EditDefaultCodebaseBranchInput
): CodebaseBranch => {
  const parsedInput = editDefaultCodebaseBranchInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  // Clone and mutate only the editable field. The full object is intentionally
  // NOT re-validated against codebaseBranchSchema: a live resource can diverge
  // from the strict schema and would otherwise fail validation here.
  const draft = structuredClone(defaultBranch);
  draft.spec.version = parsedInput.data.version;

  return draft;
};
