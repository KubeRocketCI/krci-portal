import { Secret } from "../../../groups/Core";
import { editResource } from "../../utils";
import { safeEncode } from "../../../../../utils";
import z from "zod";
import { Draft } from "immer";

const editDefectDojoIntegrationSecretSchema = z.object({
  token: z.string(),
  url: z.string(),
});

export const editDefectDojoIntegrationSecret = (
  existingSecret: Secret,
  input: z.infer<typeof editDefectDojoIntegrationSecretSchema>
): Secret => {
  return editResource(
    existingSecret,
    input,
    editDefectDojoIntegrationSecretSchema,
    (draft: Draft<Secret>, validatedInput) => {
      if (!draft.data) {
        draft.data = {};
      }
      draft.data.token = safeEncode(validatedInput.token) || "";
      draft.data.url = safeEncode(validatedInput.url) || "";
    }
  );
};
