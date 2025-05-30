import { safeEncode } from "@my-project/shared/utils";
import { codemieSecretLabels } from "../../constants";
import { CodemieDraftSecret, CreateCodemieDraftSecretInput } from "../../types";
import {
  codemieDraftSecretSchema,
  createCodemieDraftSecretInputSchema,
} from "../../schema";
import { ZodError } from "zod";

export const createCodemieDraftSecret = (
  input: CreateCodemieDraftSecretInput
): CodemieDraftSecret => {
  const parsedInput = createCodemieDraftSecretInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: CodemieDraftSecret = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: input.name,
      labels: {
        [codemieSecretLabels.secretType]: "codemie",
      },
    },
    data: {
      client_id: safeEncode(input.clientId)!,
      client_secret: safeEncode(input.clientSecret)!,
    },
    type: "Opaque",
  };

  const parsedDraft = codemieDraftSecretSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
