import { k8sResourceConfigSchema } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";

export const k8sGetProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string().optional(),
      name: z.string(),
      resourceConfig: k8sResourceConfigSchema,
    })
  )
  .query(async ({ input, ctx }) => {
    try {
      const k8sClient = new K8sClient(ctx.session);

      if (!k8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { namespace, name, resourceConfig } = input;

      return await k8sClient.getResource(resourceConfig, name, namespace);
    } catch (error) {
      throw handleK8sError(error);
    }
  });
