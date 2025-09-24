import { Secret } from "../../../groups/Core";
import { editResource } from "../../utils";
import { safeEncode } from "../../../../../utils";
import z from "zod";
import { Draft } from "immer";

const editNexusIntegrationSecretSchema = z.object({
  username: z.string(),
  password: z.string(),
  url: z.string(),
});

export const editNexusIntegrationSecret = (
  existingSecret: Secret,
  input: z.infer<typeof editNexusIntegrationSecretSchema>
): Secret => {
  return editResource(
    existingSecret,
    input,
    editNexusIntegrationSecretSchema,
    (draft: Draft<Secret>, validatedInput) => {
      if (!draft.data) {
        draft.data = {};
      }
      draft.data.username = safeEncode(validatedInput.username) || "";
      draft.data.password = safeEncode(validatedInput.password) || "";
      draft.data.url = safeEncode(validatedInput.url) || "";
    }
  );
};
