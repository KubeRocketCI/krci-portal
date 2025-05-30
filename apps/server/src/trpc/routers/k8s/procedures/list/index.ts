import { protectedProcedure } from "@/trpc/procedures/protected";
import { CustomObjectsApi } from "@kubernetes/client-node";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors";
import { createLabelSelectorString } from "../../utils/createLabelSelectorString";
import { k8sOperation, k8sResourceConfigSchema } from "@my-project/shared";
import { isCoreKubernetesResource } from "@/clients/k8s";

export const k8sListProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      resourceConfig: k8sResourceConfigSchema,
      labels: z.record(z.string()).optional().default({}),
    })
  )
  .query(async ({ input, ctx }) => {
    const { K8sClient } = ctx;

    if (!K8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const { namespace, resourceConfig, labels } = input;

    if (isCoreKubernetesResource(resourceConfig)) {
      return K8sClient.callCoreResourceOperation(resourceConfig.kind, {
        operation: k8sOperation.list,
        namespace,
      });
    }

    const customObjectsApi = K8sClient.KubeConfig.makeApiClient(
      CustomObjectsApi
    );

    const res = await customObjectsApi.listNamespacedCustomObject({
      group: resourceConfig.group,
      version: resourceConfig.version,
      plural: resourceConfig.pluralName,
      namespace,
      labelSelector: createLabelSelectorString(labels),
    });

    return res;
  });
