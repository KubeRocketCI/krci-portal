import * as k8s from "@kubernetes/client-node";
import { kubeObjectCreationSchema } from "@my-project/shared";
import { protectedProcedure } from "@/trpc/procedures/protected";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors";

export const k8sUpdateItemProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      group: z.string(),
      version: z.string(),
      namespace: z.string(),
      resourcePlural: z.string(),
      resource: kubeObjectCreationSchema,
      name: z.string(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { K8sClient } = ctx;

    if (!K8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const customObjectsApi = K8sClient.KubeConfig.makeApiClient(
      k8s.CustomObjectsApi
    );

    const { group, version, namespace, resourcePlural, name, resource } = input;

    const res = await customObjectsApi.patchNamespacedCustomObject({
      group,
      version,
      plural: resourcePlural,
      namespace,
      body: resource,
      name,
    });

    return res;
  });
