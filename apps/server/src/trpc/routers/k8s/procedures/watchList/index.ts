import { protectedProcedure } from "@/trpc/procedures/protected";
import * as k8s from "@kubernetes/client-node";
import { k8sResourceConfigSchema, KubeObjectBase } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors";
import { createCustomResourceURL } from "../../utils/createCustomResourceURL";

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
  .subscription(({ input, ctx }) => {
    return observable<{ type: string; data: KubeObjectBase }>((emit) => {
      const { K8sClient } = ctx;

      if (!K8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const watch = new k8s.Watch(K8sClient.KubeConfig);

      const { namespace, resourceConfig, resourceVersion, labels } = input;

      let controller: Awaited<ReturnType<typeof watch.watch>>;

      const watchUrl = createCustomResourceURL({
        resourceConfig,
        namespace,
        labels,
      });

      watch
        .watch(
          watchUrl,
          { resourceVersion },
          (type, obj: KubeObjectBase) => emit.next({ type, data: obj }),
          (err) => {
            if (err) emit.error(err);
          }
        )
        .then((c) => {
          controller = c;
        })
        .catch((err) => {
          emit.error(err);
        });

      return () => {
        controller?.abort();
      };
    });
  });
