import { Codemie } from "../../../../groups/KRCI";
import { editResource } from "../../../utils";
import z from "zod";
import { Draft } from "immer";

const editCodemieSchema = z.object({
  tokenEndpoint: z.string(),
  apiUrl: z.string(),
});

export const editCodemie = (existingCodemie: Codemie, input: z.infer<typeof editCodemieSchema>): Codemie => {
  return editResource(existingCodemie, input, editCodemieSchema, (draft: Draft<Codemie>, validatedInput) => {
    // Update spec fields
    if (!draft.spec) {
      draft.spec = {} as any;
    }
    if (!draft.spec.oidc) {
      draft.spec.oidc = {} as any;
    }

    draft.spec.oidc.tokenEndpoint = validatedInput.tokenEndpoint;
    draft.spec.url = validatedInput.apiUrl;
  });
};
