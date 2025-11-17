import { safeEncode } from "../../../../../utils/index.js";
import { SecretDraft, secretDraftSchema } from "../../../groups/Core/index.js";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants.js";
import z, { ZodError } from "zod";

const createChatAssistantIntegrationSecretDraftSchema = z.object({
  apiUrl: z.string(),
  assistantId: z.string(),
  token: z.string(),
});

export const createChatAssistantIntegrationSecretDraft = (
  input: z.infer<typeof createChatAssistantIntegrationSecretDraftSchema>
): SecretDraft => {
  const parsedInput = createChatAssistantIntegrationSecretDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: SecretDraft = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: integrationSecretName.CODEMIE,
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "chat-assistant",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
    },
    type: "Opaque",
    data: {
      apiUrl: safeEncode(input.apiUrl) || "",
      assistantId: safeEncode(input.assistantId) || "",
      token: safeEncode(input.token) || "",
    },
  };

  const parsedDraft = secretDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
