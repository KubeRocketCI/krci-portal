import z, { ZodError } from "zod";
import {
  gitProviderEnum,
  GitServerDraft,
  gitServerDraftSchema,
  k8sGitServerConfig,
} from "../../../../groups/KRCI/index.js";

const createGitServerDraftSchema = z.object({
  name: z.string(),
  gitHost: z.string(),
  gitProvider: gitProviderEnum,
  nameSshKeySecret: z.string(),
  gitUser: z.string(),
  httpsPort: z.number(),
  sshPort: z.number(),
  skipWebhookSSLVerification: z.boolean(),
  webhookUrl: z.string().optional(),
});

export const createGitServerDraft = (input: z.infer<typeof createGitServerDraftSchema>): GitServerDraft => {
  const parsedInput = createGitServerDraftSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new ZodError(parsedInput.error.errors);
  }

  const draft: GitServerDraft = {
    apiVersion: k8sGitServerConfig.apiVersion,
    kind: k8sGitServerConfig.kind,
    metadata: {
      name: input.name,
    },
    spec: {
      gitHost: input.gitHost,
      gitProvider: input.gitProvider,
      nameSshKeySecret: input.nameSshKeySecret,
      gitUser: input.gitUser,
      httpsPort: input.httpsPort,
      sshPort: input.sshPort,
      skipWebhookSSLVerification: input.skipWebhookSSLVerification,
    },
  };

  if (input.webhookUrl) {
    draft.spec.webhookUrl = input.webhookUrl;
  }

  const parsedDraft = gitServerDraftSchema.safeParse(draft);

  if (!parsedDraft.success) {
    throw new ZodError(parsedDraft.error.errors);
  }

  return parsedDraft.data;
};
