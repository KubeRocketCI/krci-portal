import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors";
import { protectedProcedure } from "@/trpc/procedures/protected";
import * as k8s from "@kubernetes/client-node";
import { kubeObjectCreationSchema } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const k8sCreateItemProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      group: z.string(),
      version: z.string(),
      namespace: z.string(),
      resourcePlural: z.string(),
      resource: kubeObjectCreationSchema,
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

    const { group, version, namespace, resourcePlural, resource } = input;

    const res = await customObjectsApi.createNamespacedCustomObject({
      group,
      version,
      plural: resourcePlural,
      namespace,
      body: resource,
    });

    return res;
  });
