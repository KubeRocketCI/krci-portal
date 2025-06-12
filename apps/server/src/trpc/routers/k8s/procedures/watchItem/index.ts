import * as k8s from "@kubernetes/client-node";
import { z } from "zod";
import { observable } from "@trpc/server/observable";
import { protectedProcedure } from "@/trpc/procedures/protected";
import { TRPCError } from "@trpc/server";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../errors";
import { k8sResourceConfigSchema, KubeObjectBase } from "@my-project/shared";

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
  .subscription(({ input, ctx }) => {
    return observable<{ type: string; data: KubeObjectBase }>((emit) => {
      const { K8sClient } = ctx;

      if (!K8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const watch = new k8s.Watch(K8sClient.KubeConfig);

      const { namespace, resourceVersion, name, resourceConfig } = input;

      let controller: Awaited<ReturnType<typeof watch.watch>>;

      watch
        .watch(
          `/apis/${resourceConfig.group}/${resourceConfig.version}/namespaces/${namespace}/${resourceConfig.pluralName}`,
          { resourceVersion, fieldSelector: `metadata.name=${name}` },
          (type, obj) => {
            emit.next({ type, data: obj });
          },
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
