import { z } from "zod";
import {
  containerRegistryTypeEnum,
  createPullAccountRegistrySecretDraft,
  createPushAccountRegistrySecretDraft,
  editKRCIConfigMapRegistryData,
  editPullAccountRegistrySecret,
  editPushAccountRegistrySecret,
  editRegistryServiceAccount,
  k8sConfigMapConfig,
  k8sSecretConfig,
  k8sServiceAccountConfig,
} from "@my-project/shared";
import type { ConfigMap, Secret, ServiceAccount } from "@my-project/shared";
import {
  createManageIntegrationProcedure,
  currentResourceSchema,
  integrationInputBaseSchema,
} from "../utils/createManageIntegrationProcedure/index.js";

const registryAccountSchema = z.object({
  user: z.string(),
  password: z.string(),
  currentResource: currentResourceSchema,
});

const manageRegistryIntegrationInputSchema = integrationInputBaseSchema.extend({
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
    currentResource: currentResourceSchema,
  }),
  pullAccountSecret: registryAccountSchema,
  pushAccountSecret: registryAccountSchema.optional(),
  serviceAccount: z
    .object({
      irsaRoleArn: z.string(),
      currentResource: currentResourceSchema,
    })
    .optional(),
});

export type ManageRegistryIntegrationInput = z.infer<typeof manageRegistryIntegrationInputSchema>;

type RegistryAccountSlice = z.infer<typeof registryAccountSchema>;
type RegistryConfigMapSlice = ManageRegistryIntegrationInput["configMap"];

const registryAccountArgs = (account: RegistryAccountSlice, configMap: RegistryConfigMapSlice) => ({
  registryType: configMap.registryType,
  registryEndpoint: configMap.registryEndpoint || "",
  user: account.user,
  password: account.password,
});

/**
 * The ConfigMap and the ServiceAccount are provisioned with the namespace: no create path,
 * and a create request must still carry their `currentResource`.
 */
export const k8sManageRegistryIntegrationProcedure = createManageIntegrationProcedure({
  inputSchema: manageRegistryIntegrationInputSchema,
  label: "container registry integration",
  steps: [
    {
      key: "configMap",
      resourceConfig: k8sConfigMapConfig,
      edit: (currentResource: ConfigMap, configMap) =>
        editKRCIConfigMapRegistryData(currentResource, {
          registryType: configMap.registryType,
          registrySpace: configMap.registrySpace,
          ...(configMap.registryEndpoint && { registryEndpoint: configMap.registryEndpoint }),
          ...(configMap.awsRegion && { awsRegion: configMap.awsRegion }),
        } as Parameters<typeof editKRCIConfigMapRegistryData>[1]),
    },
    {
      key: "pullAccountSecret",
      resourceConfig: k8sSecretConfig,
      createDraft: (account, input) =>
        createPullAccountRegistrySecretDraft(registryAccountArgs(account, input.configMap)),
      edit: (currentResource: Secret, account, input) =>
        editPullAccountRegistrySecret(currentResource, registryAccountArgs(account, input.configMap)),
    },
    {
      key: "pushAccountSecret",
      resourceConfig: k8sSecretConfig,
      createDraft: (account, input) =>
        createPushAccountRegistrySecretDraft(registryAccountArgs(account, input.configMap)),
      edit: (currentResource: Secret, account, input) =>
        editPushAccountRegistrySecret(currentResource, registryAccountArgs(account, input.configMap)),
    },
    {
      key: "serviceAccount",
      resourceConfig: k8sServiceAccountConfig,
      edit: (currentResource: ServiceAccount, serviceAccount) =>
        editRegistryServiceAccount(currentResource, { irsaRoleArn: serviceAccount.irsaRoleArn }),
    },
  ],
});
