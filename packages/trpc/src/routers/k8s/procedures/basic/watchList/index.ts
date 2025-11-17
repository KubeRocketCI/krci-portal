import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { Watch } from "@kubernetes/client-node";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import { createCustomResourceURL } from "../../../utils/createCustomResourceURL/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { createK8sWatchSubscription } from "../../../utils/createK8sWatchSubscription/index.js";

export const k8sWatchListProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      resourceConfig: k8sResourceConfigSchema,
      resourceVersion: z.string(),
      labels: z.record(z.string()).optional().default({}),
    })
  )
  .subscription(async function* ({ input, ctx, signal }) {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const watch = new Watch(k8sClient.KubeConfig);
    const { namespace, resourceConfig, resourceVersion, labels } = input;

    const watchUrl = createCustomResourceURL({
      resourceConfig,
      namespace,
      labels,
    });

    yield* createK8sWatchSubscription(watch, {
      watchUrl,
      watchOptions: {
        resourceVersion,
      },
      signal,
    });
  });
