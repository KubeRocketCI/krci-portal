import { GitServer } from "../../../../groups/KRCI/index.js";
import { editResource } from "../../../utils.js";
import z from "zod";
import { Draft } from "immer";
import { gitProviderEnum } from "../../../../groups/KRCI/index.js";

const editGitServerSchema = z.object({
  gitHost: z.string(),
  gitProvider: gitProviderEnum,
  nameSshKeySecret: z.string(),
  gitUser: z.string(),
  httpsPort: z.number(),
  sshPort: z.number(),
  skipWebhookSSLVerification: z.boolean(),
  webhookUrl: z.string().optional(),
});

export const editGitServer = (existingGitServer: GitServer, input: z.infer<typeof editGitServerSchema>): GitServer => {
  return editResource(existingGitServer, input, editGitServerSchema, (draft: Draft<GitServer>, validatedInput) => {
    if (!draft.spec) {
      draft.spec = {} as any;
    }

    draft.spec.gitHost = validatedInput.gitHost;
    draft.spec.gitProvider = validatedInput.gitProvider;
    draft.spec.nameSshKeySecret = validatedInput.nameSshKeySecret;
    draft.spec.gitUser = validatedInput.gitUser;
    draft.spec.httpsPort = validatedInput.httpsPort;
    draft.spec.sshPort = validatedInput.sshPort;
    draft.spec.skipWebhookSSLVerification = validatedInput.skipWebhookSSLVerification;

    if (validatedInput.webhookUrl) {
      draft.spec.webhookUrl = validatedInput.webhookUrl;
    } else {
      // Remove webhookUrl if not provided
      delete draft.spec.webhookUrl;
    }
  });
};
