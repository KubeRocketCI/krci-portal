import { rethrowOrHandleK8sError } from "../../../utils/handleK8sError/index.js";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { z } from "zod";
import { getInitializedK8sClient } from "../../../utils/getInitializedK8sClient/index.js";

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
      const k8sClient = getInitializedK8sClient(ctx);

      const { name, namespace, resourceConfig } = input;

      return await k8sClient.deleteResource(resourceConfig, name, namespace);
    } catch (error) {
      throw rethrowOrHandleK8sError(error);
    }
  });
