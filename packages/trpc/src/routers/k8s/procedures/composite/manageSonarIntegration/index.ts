import { z } from "zod";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { TRPCError } from "@trpc/server";
import { rethrowOrHandleK8sError } from "../../../utils/handleK8sError/index.js";
import { getInitializedK8sClient } from "../../../utils/getInitializedK8sClient/index.js";
import {
  k8sSecretConfig,
  createSonarQubeIntegrationSecretDraft,
  editSonarQubeIntegrationSecret,
  Secret,
  k8sQuickLinkConfig,
  editQuickLinkURL,
  QuickLink,
} from "@my-project/shared";

const manageSonarIntegrationInputSchema = z.object({
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
    token: z.string(),
    url: z.string(),
    currentResource: z.any().optional(),
  }),
});

export type ManageSonarIntegrationInput = z.infer<typeof manageSonarIntegrationInputSchema>;

export const k8sManageSonarIntegrationProcedure = protectedProcedure
  .input(manageSonarIntegrationInputSchema)
  .mutation(async ({ input, ctx }) => {
    const k8sClient = getInitializedK8sClient(ctx);

    const { namespace, mode, dirtyFields, quickLink, secret } = input;

    try {
      let updatedSecret: Secret | undefined;
      let updatedQuickLink: QuickLink | undefined;

      if (dirtyFields.secret) {
        if (mode === "create") {
          const secretDraft = createSonarQubeIntegrationSecretDraft({
            token: secret.token,
            url: secret.url,
          });
          updatedSecret = (await k8sClient.createResource(k8sSecretConfig, namespace, secretDraft)) as Secret;
        } else {
          if (!secret.currentResource) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "currentResource is required for secret in edit mode",
            });
          }
          const editedSecret = editSonarQubeIntegrationSecret(secret.currentResource as Secret, {
            token: secret.token,
            url: secret.url,
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
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "currentResource is required for quickLink in edit mode",
          });
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
          message: `Successfully ${mode === "create" ? "created" : "updated"} SonarQube integration`,
        },
      };
    } catch (error) {
      console.error("SonarQube integration operation failed:", error);
      throw rethrowOrHandleK8sError(error);
    }
  });
