import { protectedProcedure } from "../../../../../procedures/protected";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors";
import { createLabelSelectorString } from "../../../utils/createLabelSelectorString";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { handleK8sError } from "../../../utils/handleK8sError";
import { K8sClient } from "../../../../../clients/k8s";

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
      const k8sClient = new K8sClient(ctx.session);

      if (!k8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { namespace, resourceConfig, labels } = input;

      return await k8sClient.listResource(resourceConfig, namespace, createLabelSelectorString(labels));
    } catch (error) {
      throw handleK8sError(error);
    }
  });
