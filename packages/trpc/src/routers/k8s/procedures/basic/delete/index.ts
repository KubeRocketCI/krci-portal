import { handleK8sError } from "../../../utils/handleK8sError";
import { protectedProcedure } from "../../../../../procedures/protected";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors";

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
    try {
      const { K8sClient } = ctx;

      if (!K8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { name, namespace, resourceConfig } = input;

      return await K8sClient.deleteResource(resourceConfig, name, namespace);
    } catch (error) {
      throw handleK8sError(error);
    }
  });
