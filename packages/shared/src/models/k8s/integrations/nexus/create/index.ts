import { safeEncode } from "../../../../../utils";
import { SecretDraft, secretDraftSchema } from "../../../groups/Core";
import {
  integrationSecretName,
  SECRET_LABEL_SECRET_TYPE,
  SECRET_LABEL_INTEGRATION_SECRET,
} from "../../constants";
import z, { ZodError } from "zod";

const createNexusIntegrationSecretDraftSchema = z.object({
  username: z.string(),
  password: z.string(),
  url: z.string(),
});

export const createNexusIntegrationSecretDraft = (
  input: z.infer<typeof createNexusIntegrationSecretDraftSchema>
): SecretDraft => {
  const parsedInput = createNexusIntegrationSecretDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: SecretDraft = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: integrationSecretName.NEXUS,
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "nexus",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
    },
    type: "Opaque",
    data: {
      username: safeEncode(input.username) || "",
      password: safeEncode(input.password) || "",
      url: safeEncode(input.url) || "",
    },
  };

  const parsedDraft = secretDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
