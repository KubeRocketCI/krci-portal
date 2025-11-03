import { safeEncode } from "../../../../../utils";
import { SecretDraft, secretDraftSchema } from "../../../groups/Core";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants";
import z, { ZodError } from "zod";

const createSonarQubeIntegrationSecretDraftSchema = z.object({
  token: z.string(),
  url: z.string(),
});

export const createSonarQubeIntegrationSecretDraft = (
  input: z.infer<typeof createSonarQubeIntegrationSecretDraftSchema>
): SecretDraft => {
  const parsedInput = createSonarQubeIntegrationSecretDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: SecretDraft = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: integrationSecretName.SONAR,
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "sonar",
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
