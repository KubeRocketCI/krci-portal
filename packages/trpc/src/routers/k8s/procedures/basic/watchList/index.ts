import { handleK8sError } from "../../../utils/handleK8sError";
import { protectedProcedure } from "../../../../../procedures/protected";
import { Watch } from "@kubernetes/client-node";
import { k8sResourceConfigSchema, KubeObjectBase } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors";
import { createCustomResourceURL } from "../../../utils/createCustomResourceURL";
import { K8sClient } from "../../../../../clients/k8s";

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
        { resourceVersion },
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
