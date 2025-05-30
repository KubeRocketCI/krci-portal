import { safeEncode } from "../../../../../../../utils";
import { ZodError } from "zod";
import {
  codebaseDraftSecretSchema,
  createCodebaseDraftSecretInputSchema,
} from "../../schema";
import {
  CodebaseDraftSecret,
  CreateCodebaseDraftSecretInput,
} from "../../types";

export const createCodebaseDraftSecretObject = (
  input: CreateCodebaseDraftSecretInput
): CodebaseDraftSecret => {
  const parsedInput = createCodebaseDraftSecretInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: `repository-codebase-${input.codebaseName}-temp`,
    },
    data: {
      username: safeEncode(input.username)!,
      password: safeEncode(input.password)!,
    },
  };

  const parsedDraft = codebaseDraftSecretSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
