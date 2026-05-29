import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { Watch } from "@kubernetes/client-node";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { z } from "zod";
import { createCustomResourceURL } from "../../../utils/createCustomResourceURL/index.js";
import { createK8sWatchSubscription } from "../../../utils/createK8sWatchSubscription/index.js";
import { getInitializedK8sClient } from "../../../utils/getInitializedK8sClient/index.js";

export const k8sWatchListProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string().optional(),
      resourceConfig: k8sResourceConfigSchema,
      resourceVersion: z.string(),
      labels: z.record(z.string()).optional().default({}),
    })
  )
  .subscription(async function* ({ input, ctx, signal }) {
    const k8sClient = getInitializedK8sClient(ctx);

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
