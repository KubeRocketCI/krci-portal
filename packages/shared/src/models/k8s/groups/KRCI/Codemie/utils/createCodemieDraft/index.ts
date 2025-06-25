import z, { ZodError } from "zod";
import { k8sCodemieConfig } from "../../constants";
import { codemieDraftSchema, createCodemieDraftInputSchema } from "../../schema";
import { CodemieDraft, CreateCodemieDraftInput } from "../../types";

const { kind, apiVersion } = k8sCodemieConfig;

export const createCodemieDraft = (input: CreateCodemieDraftInput): CodemieDraft => {
  const parsedInput = createCodemieDraftInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: CodemieDraft = {
    apiVersion,
    kind,
    metadata: {
      name: input.name,
    },
    spec: {
      oidc: {
        secretRef: {
          name: input.name,
          clientKey: "client_id",
          secretKey: "client_secret",
        },
        tokenEndpoint: input.tokenEndpoint,
      },
      url: input.apiUrl,
    },
  };

  const parsedDraft = codemieDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
