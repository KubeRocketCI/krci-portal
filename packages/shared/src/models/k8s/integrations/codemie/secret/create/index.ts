import { SecretDraft, secretDraftSchema } from "../../../../groups/Core/index.js";
import { SECRET_LABEL_SECRET_TYPE } from "../../../constants.js";
import { safeEncode } from "../../../../../../utils/index.js";
import z, { ZodError } from "zod";

const createCodemieSecretDraftSchema = z.object({
  name: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
});

export const createCodemieSecretDraft = (input: z.infer<typeof createCodemieSecretDraftSchema>): SecretDraft => {
  const parsedInput = createCodemieSecretDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: SecretDraft = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: input.name,
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "codemie",
      },
    },
    data: {
      client_id: safeEncode(input.clientId)!,
      client_secret: safeEncode(input.clientSecret)!,
    },
    type: "Opaque",
  };

  const parsedDraft = secretDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
