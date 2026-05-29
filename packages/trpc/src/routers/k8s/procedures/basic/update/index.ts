import { rethrowOrHandleK8sError } from "../../../utils/handleK8sError/index.js";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { z } from "zod";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { getInitializedK8sClient } from "../../../utils/getInitializedK8sClient/index.js";

export const k8sUpdateItemProcedure = protectedProcedure
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
      const k8sClient = getInitializedK8sClient(ctx);

      const { namespace, name, resourceConfig, resource } = input;

      return await k8sClient.replaceResource(resourceConfig, name, namespace, resource);
    } catch (error) {
      throw rethrowOrHandleK8sError(error);
    }
  });
