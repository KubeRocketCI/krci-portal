import { Watch } from "@kubernetes/client-node";
import { KubeObjectBase } from "@my-project/shared";
import { handleK8sError } from "../handleK8sError/index.js";
import { createEventQueue, yieldEvents } from "../createEventQueue/index.js";

export type WatchEvent = { type: string; data: KubeObjectBase };

export interface K8sWatchOptions {
  watchUrl: string;
  watchOptions: {
    resourceVersion: string;
    fieldSelector?: string;
  };
  signal?: AbortSignal;
}

/**
 * Creates a Kubernetes Watch subscription that yields events as they come in.
 * This is a declarative helper that handles the common pattern of watching K8s resources.
 */
export async function* createK8sWatchSubscription(
  watch: Watch,
  options: K8sWatchOptions
): AsyncGenerator<WatchEvent, void, unknown> {
  const { watchUrl, watchOptions, signal } = options;

  const queue = createEventQueue<WatchEvent>();
  let controller: Awaited<ReturnType<typeof watch.watch>> | null = null;

  const cleanup = () => {
    queue.abort();
    if (controller) {
      controller.abort();
      controller = null;
    }
  };

  if (signal) {
    signal.addEventListener("abort", cleanup);
  }

  try {
    const watchPromise = watch.watch(
      watchUrl,
      watchOptions,
      (type, obj: KubeObjectBase) => {
        queue.emit({ type, data: obj });
      },
      (err) => {
        if (err) {
          queue.emitError(err);
        }
      }
    );

    watchPromise
      .then((c) => {
        controller = c;
      })
      .catch((err) => {
        queue.emitError(err);
      });

    yield* yieldEvents(queue, signal, handleK8sError);
  } finally {
    cleanup();
    if (signal) {
      signal.removeEventListener("abort", cleanup);
    }
  }
}
