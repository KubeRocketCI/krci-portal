import { SecretDraft, secretDraftSchema } from "../../../groups/Core";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants";
import z, { ZodError } from "zod";
import { safeEncode } from "../../../../../utils";

const createArgoCDIntegrationSecretDraftSchema = z.object({
  token: z.string(),
  url: z.string(),
});

export const createArgoCDIntegrationSecretDraft = (
  input: z.infer<typeof createArgoCDIntegrationSecretDraftSchema>
): SecretDraft => {
  const parsedInput = createArgoCDIntegrationSecretDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: SecretDraft = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: integrationSecretName.ARGO_CD,
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "argocd",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
    },
    type: "Opaque",
    data: {
      token: safeEncode(input.token) || "",
      url: safeEncode(input.url) || "",
    },
  };

  const parsedDraft = secretDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
