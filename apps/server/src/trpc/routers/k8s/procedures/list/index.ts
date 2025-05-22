import { protectedProcedure } from "@/trpc/procedures/protected";
import * as k8s from "@kubernetes/client-node";
import { z } from "zod";

export const k8sListProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      group: z.string(),
      version: z.string(),
      namespace: z.string(),
      resourcePlural: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { K8sClient } = ctx;

    if (!K8sClient.KubeConfig) {
      throw new Error("K8sClient is not initialized");
    }

    const customObjectsApi = K8sClient.KubeConfig.makeApiClient(
      k8s.CustomObjectsApi
    );

    const { group, version, namespace, resourcePlural } = input;

    const res = await customObjectsApi.listNamespacedCustomObject({
      group,
      version,
      plural: resourcePlural,
      namespace,
    });

    return res;
  });
