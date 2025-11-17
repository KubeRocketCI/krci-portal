import { Secret } from "../../../groups/Core/index.js";
import { editResource } from "../../utils.js";
import { safeEncode } from "../../../../../utils/index.js";
import z from "zod";
import { Draft } from "immer";

const editSSOIntegrationSecretSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const editSSOIntegrationSecret = (
  existingSecret: Secret,
  input: z.infer<typeof editSSOIntegrationSecretSchema>
): Secret => {
  return editResource(existingSecret, input, editSSOIntegrationSecretSchema, (draft: Draft<Secret>, validatedInput) => {
    if (!draft.data) {
      draft.data = {};
    }
    draft.data.username = safeEncode(validatedInput.username) || "";
    draft.data.password = safeEncode(validatedInput.password) || "";
  });
};
