import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { K8sClient } from "../../../../../clients/k8s/index.js";

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
    try {
      const k8sClient = new K8sClient(ctx.session);

      if (!k8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { namespace, name, resourceConfig, resource } = input;

      // Note: This procedure actually does a "replace" operation (PUT), not a patch
      return await k8sClient.replaceResource(resourceConfig, name, namespace, resource);
    } catch (error) {
      throw handleK8sError(error);
    }
  });
