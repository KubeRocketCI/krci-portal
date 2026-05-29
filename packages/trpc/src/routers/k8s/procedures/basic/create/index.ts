import { rethrowOrHandleK8sError } from "../../../utils/handleK8sError/index.js";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { z } from "zod";
import { getInitializedK8sClient } from "../../../utils/getInitializedK8sClient/index.js";

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
      const k8sClient = getInitializedK8sClient(ctx);

      const { namespace, resourceConfig, resource } = input;

      return await k8sClient.createResource(resourceConfig, namespace, resource);
    } catch (error) {
      throw rethrowOrHandleK8sError(error);
    }
  });
