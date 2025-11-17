import { Secret } from "../../../groups/Core/index.js";
import { editResource } from "../../utils.js";
import { safeEncode } from "../../../../../utils/index.js";
import z from "zod";
import { Draft } from "immer";

const editChatAssistantIntegrationSecretSchema = z.object({
  apiUrl: z.string(),
  assistantId: z.string(),
  token: z.string(),
});

export const editChatAssistantIntegrationSecret = (
  existingSecret: Secret,
  input: z.infer<typeof editChatAssistantIntegrationSecretSchema>
): Secret => {
  return editResource(
    existingSecret,
    input,
    editChatAssistantIntegrationSecretSchema,
    (draft: Draft<Secret>, validatedInput) => {
      if (!draft.data) {
        draft.data = {};
      }
      draft.data.apiUrl = safeEncode(validatedInput.apiUrl) || "";
      draft.data.assistantId = safeEncode(validatedInput.assistantId) || "";
      draft.data.token = safeEncode(validatedInput.token) || "";
    }
  );
};
