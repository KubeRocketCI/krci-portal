import { integrationSecretName, SECRET_LABEL_INTEGRATION_SECRET, SECRET_LABEL_SECRET_TYPE } from "../../../constants";
import { safeEncode } from "../../../../../../utils";
import { k8sSecretConfig, SecretDraft, secretDraftSchema } from "../../../../groups/Core";
import z, { ZodError } from "zod";

const createJiraIntegrationSecretDraftSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const createJiraIntegrationSecretDraft = (
  input: z.infer<typeof createJiraIntegrationSecretDraftSchema>
): SecretDraft => {
  const parsedInput = createJiraIntegrationSecretDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: SecretDraft = {
    apiVersion: k8sSecretConfig.apiVersion,
    kind: k8sSecretConfig.kind,
    metadata: {
      name: integrationSecretName.JIRA,
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "jira",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
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
