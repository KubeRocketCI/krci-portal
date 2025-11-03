import { safeEncode } from "../../../../../utils";
import { SecretDraft, secretDraftSchema } from "../../../groups/Core";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE } from "../../constants";
import z, { ZodError } from "zod";

const createSSOIntegrationSecretDraftSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const createSSOIntegrationSecretDraft = (
  input: z.infer<typeof createSSOIntegrationSecretDraftSchema>
): SecretDraft => {
  const parsedInput = createSSOIntegrationSecretDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: SecretDraft = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: integrationSecretName.SSO,
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "keycloak",
      },
    },
    type: "Opaque",
    data: {
      username: safeEncode(input.username) || "",
      password: safeEncode(input.password) || "",
    },
  };

  const parsedDraft = secretDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
