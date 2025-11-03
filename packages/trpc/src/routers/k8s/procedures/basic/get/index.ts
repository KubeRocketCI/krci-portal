import { k8sResourceConfigSchema } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors";
import { protectedProcedure } from "../../../../../procedures/protected";
import { handleK8sError } from "../../../utils/handleK8sError";

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
    try {
      const { K8sClient } = ctx;

      if (!K8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { namespace, name, resourceConfig } = input;

      return await K8sClient.getResource(resourceConfig, name, namespace);
    } catch (error) {
      throw handleK8sError(error);
    }
  });
