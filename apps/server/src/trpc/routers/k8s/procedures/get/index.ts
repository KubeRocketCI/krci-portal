import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors";
import { protectedProcedure } from "@/trpc/procedures/protected";
import * as k8s from "@kubernetes/client-node";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const k8sGetProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      group: z.string(),
      version: z.string(),
      namespace: z.string(),
      resourcePlural: z.string(),
      name: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { K8sClient } = ctx;

    if (!K8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const customObjectsApi = K8sClient.KubeConfig.makeApiClient(
      k8s.CustomObjectsApi
    );

    const { group, version, namespace, resourcePlural, name } = input;

    const res = await customObjectsApi.getNamespacedCustomObject({
      group,
      version,
      plural: resourcePlural,
      namespace,
      name,
    });

    return res;
  });
