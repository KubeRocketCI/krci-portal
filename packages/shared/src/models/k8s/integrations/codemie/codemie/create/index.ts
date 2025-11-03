import z, { ZodError } from "zod";
import { CodemieDraft, codemieDraftSchema, k8sCodemieConfig } from "../../../../groups/KRCI";

const createCodemieDraftSchema = z.object({
  tokenEndpoint: z.string(),
  apiUrl: z.string(),
  name: z.string(),
});

export const createCodemieDraft = (input: z.infer<typeof createCodemieDraftSchema>): CodemieDraft => {
  const parsedInput = createCodemieDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: CodemieDraft = {
    apiVersion: k8sCodemieConfig.apiVersion,
    kind: k8sCodemieConfig.kind,
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
