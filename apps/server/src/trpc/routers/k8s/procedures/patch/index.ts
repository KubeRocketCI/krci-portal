import { protectedProcedure } from "@/trpc/procedures/protected";
import { CustomObjectsApi } from "@kubernetes/client-node";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors";
import { isCoreKubernetesResource } from "@/clients/k8s";
import { k8sResourceConfigSchema, k8sOperation } from "@my-project/shared";

export const k8sPatchItemProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      name: z.string(),
      resourceConfig: k8sResourceConfigSchema,
      resource: z.any(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { K8sClient } = ctx;

    if (!K8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const { namespace, name, resourceConfig, resource } = input;

    if (isCoreKubernetesResource(resourceConfig)) {
      return K8sClient.callCoreResourceOperation(resourceConfig.kind, {
        operation: k8sOperation.replace,
        name,
        namespace,
        body: resource,
      });
    }

    const customObjectsApi =
      K8sClient.KubeConfig.makeApiClient(CustomObjectsApi);

    const res = await customObjectsApi.replaceNamespacedCustomObject({
      group: resourceConfig.group,
      version: resourceConfig.version,
      plural: resourceConfig.pluralName,
      namespace,
      name,
      body: resource,
    });

    return res;
  });
