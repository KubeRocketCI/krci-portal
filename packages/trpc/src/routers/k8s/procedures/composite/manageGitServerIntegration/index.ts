import { z } from "zod";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import {
  k8sGitServerConfig,
  k8sSecretConfig,
  GitServer,
  Secret,
  createGitServerDraft,
  createGitServerSecretDraft,
  editGitServer,
  editGitServerSecret,
  gitProviderEnum,
} from "@my-project/shared";

const secretInputSchema = z.discriminatedUnion("gitProvider", [
  z.object({
    gitProvider: z.literal("bitbucket"),
    sshPrivateKey: z.string(),
    token: z.string(),
    currentResource: z.any().optional(),
  }),
  z.object({
    gitProvider: z.literal("github"),
    sshPrivateKey: z.string(),
    token: z.string(),
    currentResource: z.any().optional(),
  }),
  z.object({
    gitProvider: z.literal("gitlab"),
    sshPrivateKey: z.string(),
    token: z.string(),
    currentResource: z.any().optional(),
  }),
  z.object({
    gitProvider: z.literal("gerrit"),
    sshPrivateKey: z.string(),
    sshPublicKey: z.string(),
    currentResource: z.any().optional(),
  }),
]);

/**
 * Input schema for manageGitServerIntegration composite operation
 */
const manageGitServerIntegrationInputSchema = z.object({
  clusterName: z.string(),
  namespace: z.string(),
  mode: z.enum(["create", "edit"]),
  dirtyFields: z.object({
    gitServer: z.boolean(),
    secret: z.boolean(),
  }),
  gitServer: z.object({
    name: z.string(),
    gitHost: z.string(),
    gitProvider: gitProviderEnum,
    gitUser: z.string(),
    nameSshKeySecret: z.string(),
    sshPort: z.number(),
    httpsPort: z.number(),
    skipWebhookSSLVerification: z.boolean(),
    tektonDisabled: z.boolean().optional(),
    webhookUrl: z.string().optional(),
    currentResource: z.any().optional(), // Required for edit mode
  }),
  secret: secretInputSchema,
});

export type ManageGitServerIntegrationInput = z.infer<typeof manageGitServerIntegrationInputSchema>;

/**
 * Composite procedure to manage Git Server integration (GitServer + Secret)
 *
 * Handles both create and edit modes with dirty field tracking.
 * Only updates resources that have been modified (dirty).
 *
 * **Fail-fast behavior:** Operations execute sequentially. If any operation fails,
 * execution stops and returns an error. Changes that succeeded remain (no rollback).
 * User can retry - idempotent operations will skip resources that are already correct.
 */
export const k8sManageGitServerIntegrationProcedure = protectedProcedure
  .input(manageGitServerIntegrationInputSchema)
  .mutation(async ({ input, ctx }) => {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw ERROR_K8S_CLIENT_NOT_INITIALIZED;
    }

    const { namespace, mode, dirtyFields, gitServer, secret } = input;

    try {
      let updatedSecret: Secret | undefined;
      let updatedGitServer: GitServer | undefined;

      // Step 1: Handle Secret operations
      if (dirtyFields.secret) {
        if (mode === "create") {
          // Create new secret (shape matches shared createGitServerSecretDraft discriminated union)
          const secretDraftInput =
            secret.gitProvider === "gerrit"
              ? {
                  gitProvider: secret.gitProvider,
                  sshPrivateKey: secret.sshPrivateKey,
                  sshPublicKey: secret.sshPublicKey,
                }
              : { gitProvider: secret.gitProvider, sshPrivateKey: secret.sshPrivateKey, token: secret.token };
          const secretDraft = createGitServerSecretDraft(secretDraftInput);

          updatedSecret = (await k8sClient.createResource(k8sSecretConfig, namespace, secretDraft as Secret)) as Secret;
        } else {
          // Edit existing secret
          if (!secret.currentResource) {
            throw new Error("currentResource is required for secret in edit mode");
          }

          const secretEditInput =
            secret.gitProvider === "gerrit"
              ? {
                  gitProvider: secret.gitProvider,
                  sshPrivateKey: secret.sshPrivateKey,
                  sshPublicKey: secret.sshPublicKey,
                }
              : { gitProvider: secret.gitProvider, sshPrivateKey: secret.sshPrivateKey, token: secret.token };
          const editedSecret = editGitServerSecret(secret.currentResource as Secret, secretEditInput);

          updatedSecret = (await k8sClient.replaceResource(
            k8sSecretConfig,
            editedSecret.metadata.name,
            namespace,
            editedSecret as Secret
          )) as Secret;
        }
      }

      // Step 2: Handle GitServer operations
      if (dirtyFields.gitServer) {
        if (mode === "create") {
          // Create new gitserver
          const gitServerDraft = createGitServerDraft({
            name: gitServer.name,
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

          updatedGitServer = (await k8sClient.createResource(
            k8sGitServerConfig,
            namespace,
            gitServerDraft as GitServer
          )) as GitServer;
        } else {
          // Edit existing gitserver
          if (!gitServer.currentResource) {
            throw new Error("currentResource is required for gitServer in edit mode");
          }

          const editedGitServer = editGitServer(gitServer.currentResource as GitServer, {
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

          updatedGitServer = (await k8sClient.replaceResource(
            k8sGitServerConfig,
            editedGitServer.metadata.name,
            namespace,
            editedGitServer as GitServer
          )) as GitServer;
        }
      }

      return {
        success: true,
        data: {
          secret: updatedSecret,
          gitServer: updatedGitServer,
          message: `Successfully ${mode === "create" ? "created" : "updated"} Git Server integration`,
        },
      };
    } catch (error) {
      console.error("Git Server integration operation failed:", error);
      throw handleK8sError(error);
    }
  });
