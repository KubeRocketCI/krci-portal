import { protectedProcedure } from "@/trpc/procedures/protected";
import * as k8s from "@kubernetes/client-node";
import { observable } from "@trpc/server/observable";
import { KubeObjectBase } from "@my-project/shared";
import { z } from "zod";

export const k8sWatchListProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      group: z.string(),
      version: z.string(),
      namespace: z.string(),
      resourcePlural: z.string(),
      resourceVersion: z.string(),
    })
  )
  .subscription(({ input, ctx }) => {
    return observable<{ type: string; data: KubeObjectBase }>((emit) => {
      const { K8sClient } = ctx;

      if (!K8sClient.KubeConfig) {
        throw new Error("K8sClient is not initialized");
      }

      const watch = new k8s.Watch(K8sClient.KubeConfig);

      const { group, version, namespace, resourcePlural, resourceVersion } =
        input;

      let controller: Awaited<ReturnType<typeof watch.watch>>;

      watch
        .watch(
          `/apis/${group}/${version}/namespaces/${namespace}/${resourcePlural}`,
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
