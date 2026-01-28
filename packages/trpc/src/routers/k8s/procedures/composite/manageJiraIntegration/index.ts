import { z } from "zod";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import {
  k8sSecretConfig,
  createJiraIntegrationSecretDraft,
  editJiraIntegrationSecret,
  Secret,
  k8sQuickLinkConfig,
  editQuickLinkURL,
  QuickLink,
  k8sJiraServerConfig,
  createJiraServerDraft,
  editJiraServer,
  JiraServer,
} from "@my-project/shared";

const manageJiraIntegrationInputSchema = z.object({
  clusterName: z.string(),
  namespace: z.string(),
  mode: z.enum(["create", "edit"]),
  dirtyFields: z.object({
    jiraServer: z.boolean(),
    quickLink: z.boolean(),
    secret: z.boolean(),
  }),
  jiraServer: z.object({
    url: z.string(),
    currentResource: z.any().optional(),
  }),
  quickLink: z
    .object({
      name: z.string(),
      externalUrl: z.string(),
      currentResource: z.any().optional(),
    })
    .optional(),
  secret: z.object({
    username: z.string(),
    password: z.string(),
    currentResource: z.any().optional(),
  }),
});

export type ManageJiraIntegrationInput = z.infer<typeof manageJiraIntegrationInputSchema>;

export const k8sManageJiraIntegrationProcedure = protectedProcedure
  .input(manageJiraIntegrationInputSchema)
  .mutation(async ({ input, ctx }) => {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw ERROR_K8S_CLIENT_NOT_INITIALIZED;
    }

    const { namespace, mode, dirtyFields, jiraServer, quickLink, secret } = input;

    try {
      let updatedSecret: Secret | undefined;
      let updatedJiraServer: JiraServer | undefined;
      let updatedQuickLink: QuickLink | undefined;

      if (dirtyFields.secret) {
        if (mode === "create") {
          const secretDraft = createJiraIntegrationSecretDraft({
            username: secret.username,
            password: secret.password,
          });
          updatedSecret = (await k8sClient.createResource(k8sSecretConfig, namespace, secretDraft as Secret)) as Secret;
        } else {
          if (!secret.currentResource) {
            throw new Error("currentResource is required for secret in edit mode");
          }
          const editedSecret = editJiraIntegrationSecret(secret.currentResource as Secret, {
            username: secret.username,
            password: secret.password,
          });
          updatedSecret = (await k8sClient.replaceResource(
            k8sSecretConfig,
            editedSecret.metadata.name,
            namespace,
            editedSecret as Secret
          )) as Secret;
        }
      }

      if (dirtyFields.jiraServer) {
        if (mode === "create") {
          const jiraServerDraft = createJiraServerDraft({ url: jiraServer.url });
          updatedJiraServer = (await k8sClient.createResource(
            k8sJiraServerConfig,
            namespace,
            jiraServerDraft as JiraServer
          )) as JiraServer;
        } else {
          if (!jiraServer.currentResource) {
            throw new Error("currentResource is required for jiraServer in edit mode");
          }
          const editedJiraServer = editJiraServer(jiraServer.currentResource as JiraServer, { url: jiraServer.url });
          updatedJiraServer = (await k8sClient.replaceResource(
            k8sJiraServerConfig,
            editedJiraServer.metadata.name,
            namespace,
            editedJiraServer as JiraServer
          )) as JiraServer;
        }
      }

      if (dirtyFields.quickLink && mode === "edit" && quickLink) {
        if (!quickLink.currentResource) {
          throw new Error("currentResource is required for quickLink in edit mode");
        }
        const editedQuickLink = editQuickLinkURL(quickLink.currentResource as QuickLink, {
          url: quickLink.externalUrl,
        });
        updatedQuickLink = (await k8sClient.replaceResource(
          k8sQuickLinkConfig,
          editedQuickLink.metadata.name,
          namespace,
          editedQuickLink as QuickLink
        )) as QuickLink;
      }

      return {
        success: true,
        data: {
          secret: updatedSecret,
          jiraServer: updatedJiraServer,
          quickLink: updatedQuickLink,
          message: `Successfully ${mode === "create" ? "created" : "updated"} Jira integration`,
        },
      };
    } catch (error) {
      console.error("Jira integration operation failed:", error);
      throw handleK8sError(error);
    }
  });
