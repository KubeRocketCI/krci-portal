import z from "zod";
import { IRSA_ROLE_ARN_ANNOTATION } from "../../constants";
import { ServiceAccount } from "../../../../groups/Core";
import { editResource } from "../../../utils";
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
      // Initialize metadata if it doesn't exist
      if (!draft.metadata) {
        draft.metadata = {};
      }
      if (!draft.metadata.annotations) {
        draft.metadata.annotations = {};
      }

      // Update the IRSA role ARN annotation
      draft.metadata.annotations[IRSA_ROLE_ARN_ANNOTATION] =
        validatedInput.irsaRoleArn;
    }
  );
};
