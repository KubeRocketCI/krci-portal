import { Secret } from "../../../../groups/Core";
import { editResource } from "../../../utils";
import { safeEncode } from "../../../../../../utils";
import z from "zod";
import { Draft } from "immer";

const editJiraIntegrationSecretSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const editJiraIntegrationSecret = (
  existingSecret: Secret,
  input: z.infer<typeof editJiraIntegrationSecretSchema>
): Secret => {
  return editResource(
    existingSecret,
    input,
    editJiraIntegrationSecretSchema,
    (draft: Draft<Secret>, validatedInput) => {
      // Update only the data fields we care about
      if (!draft.data) {
        draft.data = {};
      }
      draft.data.username = safeEncode(validatedInput.username) || "";
      draft.data.password = safeEncode(validatedInput.password) || "";
    }
  );
};
