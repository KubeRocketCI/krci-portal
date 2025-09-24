import { Secret } from "../../../groups/Core";
import { editResource } from "../../utils";
import { safeEncode } from "../../../../../utils";
import z from "zod";

const editArgoCDIntegrationSecretSchema = z.object({
  token: z.string(),
  url: z.string(),
});

export const editArgoCDIntegrationSecret = (
  existingSecret: Secret,
  input: z.infer<typeof editArgoCDIntegrationSecretSchema>
): Secret => {
  return editResource(
    existingSecret,
    input,
    editArgoCDIntegrationSecretSchema,
    (draft, validatedInput) => {
      // Update only the data fields we care about
      if (!draft.data) {
        draft.data = {};
      }
      draft.data.token = safeEncode(validatedInput.token) || "";
      draft.data.url = safeEncode(validatedInput.url) || "";
    }
  );
};
