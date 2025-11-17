import z from "zod";
import { IRSA_ROLE_ARN_ANNOTATION } from "../../constants.js";
import { ServiceAccount } from "../../../../groups/Core/index.js";
import { editResource } from "../../../utils.js";
import { Draft } from "immer";

const editRegistryServiceAccountSchema = z.object({
  irsaRoleArn: z.string(),
});

export const editRegistryServiceAccount = (
  serviceAccount: ServiceAccount,
  input: z.infer<typeof editRegistryServiceAccountSchema>
): ServiceAccount => {
  return editResource(
    serviceAccount,
    input,
    editRegistryServiceAccountSchema,
    (draft: Draft<ServiceAccount>, validatedInput) => {
      // Initialize annotations if it doesn't exist
      if (!draft.metadata.annotations) {
        draft.metadata.annotations = {};
      }

      // Update the IRSA role ARN annotation
      draft.metadata.annotations[IRSA_ROLE_ARN_ANNOTATION] = validatedInput.irsaRoleArn;
    }
  );
};
