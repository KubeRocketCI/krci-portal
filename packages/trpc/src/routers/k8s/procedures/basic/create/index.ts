import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";

export const k8sCreateItemProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      resource: z.any(),
      resourceConfig: k8sResourceConfigSchema,
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      const k8sClient = new K8sClient(ctx.session);

      if (!k8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { namespace, resourceConfig, resource } = input;

      return await k8sClient.createResource(resourceConfig, namespace, resource);
    } catch (error) {
      throw handleK8sError(error);
    }
  });
