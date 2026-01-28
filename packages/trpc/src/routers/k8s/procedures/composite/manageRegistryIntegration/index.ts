import { z } from "zod";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import {
  k8sConfigMapConfig,
  k8sSecretConfig,
  k8sServiceAccountConfig,
  ConfigMap,
  Secret,
  ServiceAccount,
  containerRegistryTypeEnum,
  editKRCIConfigMapRegistryData,
  createPullAccountRegistrySecretDraft,
  createPushAccountRegistrySecretDraft,
  editPullAccountRegistrySecret,
  editPushAccountRegistrySecret,
  editRegistryServiceAccount,
} from "@my-project/shared";

/**
 * Input schema for manageRegistryIntegration composite operation
 */
const manageRegistryIntegrationInputSchema = z.object({
  clusterName: z.string(),
  namespace: z.string(),
  mode: z.enum(["create", "edit"]),
  dirtyFields: z.object({
    configMap: z.boolean(),
    pullAccountSecret: z.boolean(),
    pushAccountSecret: z.boolean(),
    serviceAccount: z.boolean(),
  }),
  configMap: z.object({
    registryType: containerRegistryTypeEnum,
    registrySpace: z.string(),
    registryEndpoint: z.string().optional(),
    awsRegion: z.string().optional(),
    currentResource: z.any().optional(), // Required for edit mode
  }),
  pullAccountSecret: z.object({
    user: z.string(),
    password: z.string(),
    currentResource: z.any().optional(), // Required for edit mode
  }),
  pushAccountSecret: z
    .object({
      user: z.string(),
      password: z.string(),
      currentResource: z.any().optional(), // Required for edit mode
    })
    .optional(),
  serviceAccount: z
    .object({
      irsaRoleArn: z.string(),
      currentResource: z.any().optional(), // Required for edit mode
    })
    .optional(),
});

export type ManageRegistryIntegrationInput = z.infer<typeof manageRegistryIntegrationInputSchema>;

/**
 * Composite procedure to manage Container Registry integration
 *
 * Handles up to 4 resources:
 * - ConfigMap (registry configuration) - always required
 * - PullAccount Secret (pull credentials) - always required
 * - PushAccount Secret (push credentials) - optional, registry-type dependent
 * - ServiceAccount (IRSA role for ECR) - optional, only for ECR type
 *
 * **Fail-fast behavior:** Operations execute sequentially. If any operation fails,
 * execution stops and returns an error. Changes that succeeded remain (no rollback).
 * User can retry - idempotent operations will skip resources that are already correct.
 */
export const k8sManageRegistryIntegrationProcedure = protectedProcedure
  .input(manageRegistryIntegrationInputSchema)
  .mutation(async ({ input, ctx }) => {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw ERROR_K8S_CLIENT_NOT_INITIALIZED;
    }

    const { namespace, mode, dirtyFields, configMap, pullAccountSecret, pushAccountSecret, serviceAccount } = input;

    try {
      let updatedConfigMap: ConfigMap | undefined;
      let updatedPullAccountSecret: Secret | undefined;
      let updatedPushAccountSecret: Secret | undefined;
      let updatedServiceAccount: ServiceAccount | undefined;

      // Step 1: Handle ConfigMap operations (always in edit mode for registry)
      if (dirtyFields.configMap) {
        if (!configMap.currentResource) {
          throw new Error("currentResource is required for configMap in edit mode");
        }

        const editedConfigMap = editKRCIConfigMapRegistryData(
          configMap.currentResource as ConfigMap,
          {
            registryType: configMap.registryType,
            registrySpace: configMap.registrySpace,
            ...(configMap.registryEndpoint && { registryEndpoint: configMap.registryEndpoint }),
            ...(configMap.awsRegion && { awsRegion: configMap.awsRegion }),
          } as any
        );

        updatedConfigMap = (await k8sClient.replaceResource(
          k8sConfigMapConfig,
          editedConfigMap.metadata.name,
          namespace,
          editedConfigMap
        )) as ConfigMap;
      }

      // Step 2: Handle PullAccount Secret operations
      if (dirtyFields.pullAccountSecret) {
        if (mode === "create") {
          // Create new pull account secret
          const pullSecretDraft = createPullAccountRegistrySecretDraft({
            registryType: configMap.registryType,
            registryEndpoint: configMap.registryEndpoint || "",
            user: pullAccountSecret.user,
            password: pullAccountSecret.password,
          });

          updatedPullAccountSecret = (await k8sClient.createResource(
            k8sSecretConfig,
            namespace,
            pullSecretDraft
          )) as Secret;
        } else {
          // Edit existing pull account secret
          if (!pullAccountSecret.currentResource) {
            throw new Error("currentResource is required for pullAccountSecret in edit mode");
          }

          const editedPullSecret = editPullAccountRegistrySecret(pullAccountSecret.currentResource as Secret, {
            registryType: configMap.registryType,
            registryEndpoint: configMap.registryEndpoint || "",
            user: pullAccountSecret.user,
            password: pullAccountSecret.password,
          });

          updatedPullAccountSecret = (await k8sClient.replaceResource(
            k8sSecretConfig,
            editedPullSecret.metadata.name,
            namespace,
            editedPullSecret
          )) as Secret;
        }
      }

      // Step 3: Handle PushAccount Secret operations (optional, registry-type dependent)
      if (dirtyFields.pushAccountSecret && pushAccountSecret) {
        if (mode === "create") {
          // Create new push account secret
          const pushSecretDraft = createPushAccountRegistrySecretDraft({
            registryType: configMap.registryType,
            registryEndpoint: configMap.registryEndpoint || "",
            user: pushAccountSecret.user,
            password: pushAccountSecret.password,
          });

          updatedPushAccountSecret = (await k8sClient.createResource(
            k8sSecretConfig,
            namespace,
            pushSecretDraft
          )) as Secret;
        } else {
          // Edit existing push account secret
          if (!pushAccountSecret.currentResource) {
            throw new Error("currentResource is required for pushAccountSecret in edit mode");
          }

          const editedPushSecret = editPushAccountRegistrySecret(pushAccountSecret.currentResource as Secret, {
            registryType: configMap.registryType,
            registryEndpoint: configMap.registryEndpoint || "",
            user: pushAccountSecret.user,
            password: pushAccountSecret.password,
          });

          updatedPushAccountSecret = (await k8sClient.replaceResource(
            k8sSecretConfig,
            editedPushSecret.metadata.name,
            namespace,
            editedPushSecret
          )) as Secret;
        }
      }

      // Step 4: Handle ServiceAccount operations (optional, ECR only)
      if (dirtyFields.serviceAccount && serviceAccount) {
        if (!serviceAccount.currentResource) {
          throw new Error("currentResource is required for serviceAccount in edit mode");
        }

        const editedServiceAccount = editRegistryServiceAccount(serviceAccount.currentResource as ServiceAccount, {
          irsaRoleArn: serviceAccount.irsaRoleArn,
        });

        updatedServiceAccount = (await k8sClient.replaceResource(
          k8sServiceAccountConfig,
          editedServiceAccount.metadata.name,
          namespace,
          editedServiceAccount
        )) as ServiceAccount;
      }

      return {
        success: true,
        data: {
          configMap: updatedConfigMap,
          pullAccountSecret: updatedPullAccountSecret,
          pushAccountSecret: updatedPushAccountSecret,
          serviceAccount: updatedServiceAccount,
          message: `Successfully ${mode === "create" ? "created" : "updated"} container registry integration`,
        },
      };
    } catch (error) {
      console.error("Container registry integration operation failed:", error);
      throw handleK8sError(error);
    }
  });
