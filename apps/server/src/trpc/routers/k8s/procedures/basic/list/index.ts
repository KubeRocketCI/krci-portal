import { protectedProcedure } from "@/trpc/procedures/protected";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors";
import { createLabelSelectorString } from "../../../utils/createLabelSelectorString";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { handleK8sError } from "@/trpc/routers/k8s/utils/handleK8sError";

export const k8sListProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      resourceConfig: k8sResourceConfigSchema,
      labels: z.record(z.string()).optional().default({}),
    })
  )
  .query(async ({ input, ctx }) => {
    try {
      const { K8sClient } = ctx;

      if (!K8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { namespace, resourceConfig, labels } = input;

      return await K8sClient.listResource(
        resourceConfig,
        namespace,
        createLabelSelectorString(labels)
      );
    } catch (error) {
      throw handleK8sError(error);
    }
  });
