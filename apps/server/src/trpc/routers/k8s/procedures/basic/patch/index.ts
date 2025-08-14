import { handleK8sError } from "@/trpc/routers/k8s/utils/handleK8sError";
import { protectedProcedure } from "@/trpc/procedures/protected";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors";
import { k8sResourceConfigSchema } from "@my-project/shared";

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
      const { K8sClient } = ctx;

      if (!K8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { namespace, name, resourceConfig, resource } = input;

      // Note: This procedure actually does a "replace" operation (PUT), not a patch
      return await K8sClient.replaceResource(
        resourceConfig,
        name,
        namespace,
        resource
      );
    } catch (error) {
      throw handleK8sError(error);
    }
  });
