import { z } from "zod";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import {
  k8sSecretConfig,
  createChatAssistantIntegrationSecretDraft,
  editChatAssistantIntegrationSecret,
  Secret,
  k8sQuickLinkConfig,
  editQuickLinkURL,
  QuickLink,
} from "@my-project/shared";

const manageChatAssistantIntegrationInputSchema = z.object({
  clusterName: z.string(),
  namespace: z.string(),
  mode: z.enum(["create", "edit"]),
  dirtyFields: z.object({
    quickLink: z.boolean(),
    secret: z.boolean(),
  }),
  quickLink: z
    .object({
      name: z.string(),
      externalUrl: z.string(),
      currentResource: z.any().optional(),
    })
    .optional(),
  secret: z.object({
    apiUrl: z.string(),
    token: z.string(),
    assistantId: z.string(),
    currentResource: z.any().optional(),
  }),
});

export type ManageChatAssistantIntegrationInput = z.infer<typeof manageChatAssistantIntegrationInputSchema>;

export const k8sManageChatAssistantIntegrationProcedure = protectedProcedure
  .input(manageChatAssistantIntegrationInputSchema)
  .mutation(async ({ input, ctx }) => {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw ERROR_K8S_CLIENT_NOT_INITIALIZED;
    }

    const { namespace, mode, dirtyFields, quickLink, secret } = input;

    try {
      let updatedSecret: Secret | undefined;
      let updatedQuickLink: QuickLink | undefined;

      if (dirtyFields.secret) {
        if (mode === "create") {
          const secretDraft = createChatAssistantIntegrationSecretDraft({
            apiUrl: secret.apiUrl,
            token: secret.token,
            assistantId: secret.assistantId,
          });
          updatedSecret = (await k8sClient.createResource(k8sSecretConfig, namespace, secretDraft)) as Secret;
        } else {
          if (!secret.currentResource) {
            throw new Error("currentResource is required for secret in edit mode");
          }
          const editedSecret = editChatAssistantIntegrationSecret(secret.currentResource as Secret, {
            apiUrl: secret.apiUrl,
            token: secret.token,
            assistantId: secret.assistantId,
          });
          updatedSecret = (await k8sClient.replaceResource(
            k8sSecretConfig,
            editedSecret.metadata.name,
            namespace,
            editedSecret
          )) as Secret;
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
          editedQuickLink
        )) as QuickLink;
      }

      return {
        success: true,
        data: {
          secret: updatedSecret,
          quickLink: updatedQuickLink,
          message: `Successfully ${mode === "create" ? "created" : "updated"} Chat Assistant integration`,
        },
      };
    } catch (error) {
      console.error("Chat Assistant integration operation failed:", error);
      throw handleK8sError(error);
    }
  });
