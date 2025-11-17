import { Watch } from "@kubernetes/client-node";
import { z } from "zod";
import { handleK8sError } from "../../../utils/handleK8sError";
import { protectedProcedure } from "../../../../../procedures/protected";
import { TRPCError } from "@trpc/server";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors";
import { k8sResourceConfigSchema, KubeObjectBase } from "@my-project/shared";
import { createCustomResourceURL } from "../../../utils/createCustomResourceURL";
import { K8sClient } from "../../../../../clients/k8s";

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

    // Create a queue to bridge callbacks to async generator
    const eventQueue: Array<{ type: string; data: KubeObjectBase } | { error: unknown }> = [];
    let resolveNext: (() => void) | null = null;
    let controller: Awaited<ReturnType<typeof watch.watch>> | null = null;
    let isAborted = false;

    // Cleanup function
    const cleanup = () => {
      isAborted = true;
      if (controller) {
        controller.abort();
        controller = null;
      }
    };

    // Handle abort signal
    if (signal) {
      signal.addEventListener("abort", cleanup);
    }

    try {
      // Start the watch
      const watchPromise = watch.watch(
        watchUrl,
        { resourceVersion, fieldSelector: `metadata.name=${name}` },
        (type, obj: KubeObjectBase) => {
          if (!isAborted) {
            eventQueue.push({ type, data: obj });
            if (resolveNext) {
              resolveNext();
              resolveNext = null;
            }
          }
        },
        (err) => {
          if (err && !isAborted) {
            eventQueue.push({ error: err });
            if (resolveNext) {
              resolveNext();
              resolveNext = null;
            }
          }
        }
      );

      watchPromise
        .then((c) => {
          controller = c;
        })
        .catch((err) => {
          if (!isAborted) {
            eventQueue.push({ error: err });
            if (resolveNext) {
              resolveNext();
              resolveNext = null;
            }
          }
        });

      // Yield events as they come in
      while (!isAborted && !signal?.aborted) {
        // Wait for next event or abort
        if (eventQueue.length === 0) {
          await new Promise<void>((resolve) => {
            resolveNext = resolve;
            // Check if signal was aborted while waiting
            if (signal?.aborted) {
              resolve();
            }
          });
        }

        // Process all queued events
        while (eventQueue.length > 0 && !signal?.aborted) {
          const event = eventQueue.shift()!;
          if ("error" in event) {
            throw handleK8sError(event.error);
          }
          yield event;
        }
      }
    } catch (error) {
      throw handleK8sError(error);
    } finally {
      cleanup();
      if (signal) {
        signal.removeEventListener("abort", cleanup);
      }
    }
  });
