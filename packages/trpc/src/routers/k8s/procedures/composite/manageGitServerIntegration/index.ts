import { z } from "zod";
import {
  createGitServerDraft,
  createGitServerSecretDraft,
  editGitServer,
  editGitServerSecret,
  gitProvider,
  gitProviderEnum,
  k8sGitServerConfig,
  k8sResourceNameSchema,
  k8sSecretConfig,
} from "@my-project/shared";
import type { GitServer, Secret } from "@my-project/shared";
import {
  createManageIntegrationProcedure,
  integrationInputBaseSchema,
} from "../utils/createManageIntegrationProcedure/index.js";

const secretInputSchema = z.discriminatedUnion("gitProvider", [
  z.object({
    gitProvider: z.literal(gitProvider.bitbucket),
    sshPrivateKey: z.string(),
    token: z.string(),
    currentResource: z.any().optional(),
  }),
  z.object({
    gitProvider: z.literal(gitProvider.github),
    sshPrivateKey: z.string(),
    token: z.string(),
    currentResource: z.any().optional(),
  }),
  z.object({
    gitProvider: z.literal(gitProvider.gitlab),
    sshPrivateKey: z.string(),
    token: z.string(),
    currentResource: z.any().optional(),
  }),
  z.object({
    gitProvider: z.literal(gitProvider.gerrit),
    sshPrivateKey: z.string(),
    sshPublicKey: z.string(),
    currentResource: z.any().optional(),
  }),
]);

const manageGitServerIntegrationInputSchema = integrationInputBaseSchema.extend({
  dirtyFields: z.object({
    gitServer: z.boolean(),
    secret: z.boolean(),
  }),
  gitServer: z.object({
    name: z.string(),
    gitHost: z.string(),
    gitProvider: gitProviderEnum,
    gitUser: z.string(),
    nameSshKeySecret: k8sResourceNameSchema,
    sshPort: z.number(),
    httpsPort: z.number(),
    skipWebhookSSLVerification: z.boolean(),
    tektonDisabled: z.boolean().optional(),
    webhookUrl: z.string().optional(),
    currentResource: z.any().optional(),
  }),
  secret: secretInputSchema,
});

export type ManageGitServerIntegrationInput = z.infer<typeof manageGitServerIntegrationInputSchema>;

type GitServerSecretSlice = z.infer<typeof secretInputSchema>;
type GitServerSlice = ManageGitServerIntegrationInput["gitServer"];

const gitServerSecretKeys = (secret: GitServerSecretSlice) =>
  secret.gitProvider === gitProvider.gerrit
    ? { gitProvider: secret.gitProvider, sshPrivateKey: secret.sshPrivateKey, sshPublicKey: secret.sshPublicKey }
    : { gitProvider: secret.gitProvider, sshPrivateKey: secret.sshPrivateKey, token: secret.token };

const gitServerSpec = (gitServer: GitServerSlice) => ({
  gitHost: gitServer.gitHost,
  gitProvider: gitServer.gitProvider,
  gitUser: gitServer.gitUser,
  nameSshKeySecret: gitServer.nameSshKeySecret,
  sshPort: gitServer.sshPort,
  httpsPort: gitServer.httpsPort,
  skipWebhookSSLVerification: gitServer.skipWebhookSSLVerification,
  tektonDisabled: gitServer.tektonDisabled,
  webhookUrl: gitServer.webhookUrl,
});

export const k8sManageGitServerIntegrationProcedure = createManageIntegrationProcedure({
  inputSchema: manageGitServerIntegrationInputSchema,
  label: "Git Server integration",
  steps: [
    {
      // An edit of an existing GitServer may still have to create the SSH secret for the first time.
      branchOn: "currentResource",
      key: "secret",
      resourceConfig: k8sSecretConfig,
      // Reads the gitServer slice regardless of its dirty flag; the client always sends it whole.
      createDraft: (secret, input) =>
        createGitServerSecretDraft({
          ...gitServerSecretKeys(secret),
          secretName: input.gitServer.nameSshKeySecret,
        }) as Secret,
      edit: (currentResource: Secret, secret) => editGitServerSecret(currentResource, gitServerSecretKeys(secret)),
    },
    {
      key: "gitServer",
      resourceConfig: k8sGitServerConfig,
      createDraft: (gitServer) =>
        createGitServerDraft({ name: gitServer.name, ...gitServerSpec(gitServer) }) as GitServer,
      edit: (currentResource: GitServer, gitServer) => editGitServer(currentResource, gitServerSpec(gitServer)),
    },
  ],
});
