import { isCoreKubernetesResource } from "@/clients/k8s";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors";
import { protectedProcedure } from "@/trpc/procedures/protected";
import { CustomObjectsApi } from "@kubernetes/client-node";
import { k8sOperation, k8sResourceConfigSchema } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const k8sGetProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      name: z.string(),
      resourceConfig: k8sResourceConfigSchema,
    })
  )
  .query(async ({ input, ctx }) => {
    const { K8sClient } = ctx;

    if (!K8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const { namespace, name, resourceConfig } = input;

    if (isCoreKubernetesResource(resourceConfig)) {
      return K8sClient.callCoreResourceOperation(resourceConfig.kind, {
        operation: k8sOperation.read,
        name,
        namespace,
      });
    }

    const customObjectsApi =
      K8sClient.KubeConfig.makeApiClient(CustomObjectsApi);

    const res = await customObjectsApi.getNamespacedCustomObject({
      group: resourceConfig.group,
      version: resourceConfig.version,
      plural: resourceConfig.pluralName,
      namespace,
      name,
    });

    return res;
  });
