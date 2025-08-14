import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "@/trpc/procedures/protected";
import { handleK8sError } from "@/trpc/routers/k8s/utils/handleK8sError";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors";

export const kubeRootConfigName = "kube-root-ca.crt";

export const k8sGetKubeConfig = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    try {
      const { K8sClient } = ctx;

      if (!K8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { clusterName } = input;

      const config = K8sClient.getKubeConfigForCluster(clusterName);

      return config;
    } catch (error) {
      throw handleK8sError(error);
    }
  });
