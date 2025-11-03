import { safeEncode } from "../../../../../utils";
import { SecretDraft, secretDraftSchema } from "../../../groups/Core";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants";
import z, { ZodError } from "zod";

const createDefectDojoIntegrationSecretDraftSchema = z.object({
  token: z.string(),
  url: z.string(),
});

export const createDefectDojoIntegrationSecretDraft = (
  input: z.infer<typeof createDefectDojoIntegrationSecretDraftSchema>
): SecretDraft => {
  const parsedInput = createDefectDojoIntegrationSecretDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: SecretDraft = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: integrationSecretName.DEFECT_DOJO,
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "defectdojo",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
    },
    type: "Opaque",
    data: {
      token: safeEncode(input.token) || "",
      url: safeEncode(input.url) || "",
    },
  };

  const parsedDraft = secretDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
