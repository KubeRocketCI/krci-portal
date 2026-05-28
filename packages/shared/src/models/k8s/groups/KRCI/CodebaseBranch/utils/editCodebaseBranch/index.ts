import { ZodError } from "zod";
import { CodebaseBranch } from "../../types.js";
import { editCodebaseBranchInputSchema } from "./schema.js";
import { EditCodebaseBranchInput } from "./types.js";

export const editCodebaseBranchObject = (
  codebaseBranch: CodebaseBranch,
  input: EditCodebaseBranchInput
): CodebaseBranch => {
  const parsedInput = editCodebaseBranchInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  // Clone and mutate only the editable field. The full object is intentionally
  // NOT re-validated against codebaseBranchSchema: a live resource can diverge
  // from the strict schema and would otherwise fail validation here.
  const draft = structuredClone(codebaseBranch);
  draft.spec.pipelines = parsedInput.data.pipelines;

  return draft;
};
