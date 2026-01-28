import { z } from "zod";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import {
  k8sSecretConfig,
  createArgoCDIntegrationSecretDraft,
  editArgoCDIntegrationSecret,
  Secret,
  k8sQuickLinkConfig,
  editQuickLinkURL,
  QuickLink,
} from "@my-project/shared";

/**
 * Input schema for manageArgoCDIntegration composite operation
 */
const manageArgoCDIntegrationInputSchema = z.object({
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
      currentResource: z.any().optional(), // The existing QuickLink resource (for edit mode)
    })
    .optional(),
  secret: z.object({
    token: z.string(),
    url: z.string(),
    currentResource: z.any().optional(), // The existing Secret resource (for edit mode)
  }),
});

export type ManageArgoCDIntegrationInput = z.infer<typeof manageArgoCDIntegrationInputSchema>;

/**
 * Composite procedure to manage ArgoCD integration (QuickLink + Secret)
 *
 * Handles both create and edit modes with dirty field tracking.
 * Only updates resources that have been modified (dirty).
 *
 * **Fail-fast behavior:** Operations execute sequentially. If any operation fails,
 * execution stops and returns an error. Changes that succeeded remain (no rollback).
 * User can retry - idempotent operations will skip resources that are already correct.
 */
export const k8sManageArgoCDIntegrationProcedure = protectedProcedure
  .input(manageArgoCDIntegrationInputSchema)
  .mutation(async ({ input, ctx }) => {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw ERROR_K8S_CLIENT_NOT_INITIALIZED;
    }

    const { namespace, mode, dirtyFields, quickLink, secret } = input;

    try {
      let updatedSecret: Secret | undefined;
      let updatedQuickLink: QuickLink | undefined;

      // Handle Secret operations
      if (dirtyFields.secret) {
        if (mode === "create") {
          // Create new secret
          const secretDraft = createArgoCDIntegrationSecretDraft({
            token: secret.token,
            url: secret.url,
          });

          updatedSecret = (await k8sClient.createResource(k8sSecretConfig, namespace, secretDraft as Secret)) as Secret;
        } else {
          // Edit existing secret
          if (!secret.currentResource) {
            throw new Error("currentResource is required for secret in edit mode");
          }

          const editedSecret = editArgoCDIntegrationSecret(secret.currentResource as Secret, {
            token: secret.token,
            url: secret.url,
          });

          updatedSecret = (await k8sClient.replaceResource(
            k8sSecretConfig,
            editedSecret.metadata.name,
            namespace,
            editedSecret as Secret
          )) as Secret;
        }
      }

      // Handle QuickLink operations (only in edit mode and if dirty)
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
          quickLink: updatedQuickLink,
          message: `Successfully ${mode === "create" ? "created" : "updated"} ArgoCD integration`,
        },
      };
    } catch (error) {
      console.error("ArgoCD integration operation failed:", error);
      throw handleK8sError(error);
    }
  });
