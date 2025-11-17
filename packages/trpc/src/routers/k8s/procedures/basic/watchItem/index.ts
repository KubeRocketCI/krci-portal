import { Watch } from "@kubernetes/client-node";
import { z } from "zod";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { TRPCError } from "@trpc/server";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { createCustomResourceURL } from "../../../utils/createCustomResourceURL/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { createK8sWatchSubscription } from "../../../utils/createK8sWatchSubscription/index.js";

export const k8sWatchItemProcedure = protectedProcedure
  .input(
    z.object({
      resourceConfig: k8sResourceConfigSchema,
      clusterName: z.string(),
      namespace: z.string(),
      resourceVersion: z.string(),
      name: z.string(),
    })
  )
  .subscription(async function* ({ input, ctx, signal }) {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const watch = new Watch(k8sClient.KubeConfig);
    const { namespace, resourceVersion, name, resourceConfig } = input;

    const watchUrl = createCustomResourceURL({
      resourceConfig,
      namespace,
    });

    yield* createK8sWatchSubscription(watch, {
      watchUrl,
      watchOptions: {
        resourceVersion,
        fieldSelector: `metadata.name=${name}`,
      },
      signal,
    });
  });
