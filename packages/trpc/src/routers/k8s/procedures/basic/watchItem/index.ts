import { Watch } from "@kubernetes/client-node";
import { z } from "zod";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { createCustomResourceURL } from "../../../utils/createCustomResourceURL/index.js";
import { createK8sWatchSubscription } from "../../../utils/createK8sWatchSubscription/index.js";
import { getInitializedK8sClient } from "../../../utils/getInitializedK8sClient/index.js";

export const k8sWatchItemProcedure = protectedProcedure
  .input(
    z.object({
      resourceConfig: k8sResourceConfigSchema,
      clusterName: z.string(),
      namespace: z.string().optional(),
      resourceVersion: z.string(),
      name: z.string(),
    })
  )
  .subscription(async function* ({ input, ctx, signal }) {
    const k8sClient = getInitializedK8sClient(ctx);

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
