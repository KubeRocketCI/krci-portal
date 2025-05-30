import { isCoreKubernetesResource } from "@/clients/k8s";
import { protectedProcedure } from "@/trpc/procedures/protected";
import * as k8s from "@kubernetes/client-node";
import { k8sOperation, k8sResourceConfigSchema } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors";

export const k8sDeleteItemProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      name: z.string(),
      resource: z.any(),
      resourceConfig: k8sResourceConfigSchema,
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { K8sClient } = ctx;

    if (!K8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const { name, namespace, resourceConfig } = input;

    if (isCoreKubernetesResource(resourceConfig)) {
      return K8sClient.callCoreResourceOperation(resourceConfig.kind, {
        operation: k8sOperation.delete,
        namespace,
        name,
      });
    }

    const customObjectsApi = K8sClient.KubeConfig.makeApiClient(
      k8s.CustomObjectsApi
    );

    return await customObjectsApi.deleteNamespacedCustomObject({
      group: resourceConfig.group,
      version: resourceConfig.version,
      plural: resourceConfig.pluralName,
      namespace,
      name,
    });
  });
