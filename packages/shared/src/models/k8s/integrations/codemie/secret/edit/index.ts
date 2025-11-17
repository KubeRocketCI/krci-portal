import { Secret } from "../../../../groups/Core/index.js";
import { editResource } from "../../../utils.js";
import { safeEncode } from "../../../../../../utils/index.js";
import z from "zod";
import { Draft } from "immer";

const editCodemieSecretSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
});

export const editCodemieSecret = (existingSecret: Secret, input: z.infer<typeof editCodemieSecretSchema>): Secret => {
  return editResource(existingSecret, input, editCodemieSecretSchema, (draft: Draft<Secret>, validatedInput) => {
    // Update only the data fields we care about
    if (!draft.data) {
      draft.data = {};
    }
    draft.data.client_id = safeEncode(validatedInput.clientId) || "";
    draft.data.client_secret = safeEncode(validatedInput.clientSecret) || "";
  });
};
