import { Watch } from "@kubernetes/client-node";
import { K8sApiError, KubeObjectBase } from "@my-project/shared";
import { handleK8sError } from "../handleK8sError/index.js";
import { createEventQueue, yieldEvents } from "../../../../utils/createEventQueue/index.js";

export type WatchEvent = { type: string; data: KubeObjectBase };

/**
 * Reads the HTTP status off a watch error. `@kubernetes/client-node` reports a
 * non-200 watch response as a plain Error carrying `statusCode`; a K8s Status
 * object carries `code`. Both must be numeric — a transport failure surfaced on
 * the same callback carries a string `code` (ENOTFOUND, ECONNRESET), which is
 * not a status.
 */
function readHttpStatus(error: unknown): number | undefined {
  const { statusCode, code } = (error ?? {}) as { statusCode?: unknown; code?: unknown };
  if (typeof statusCode === "number") return statusCode;
  if (typeof code === "number") return code;
  return undefined;
}

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
 * Automatically restarts the watch when the K8s API server closes the stream
 * (typically every 5-10 minutes due to server-side watch timeout).
 *
 * Implements the standard Kubernetes ListWatch/Reflector reconnection pattern:
 * - Tracks resourceVersion from each event for seamless restart
 * - On clean termination (watch timeout): restarts from latest resourceVersion
 * - On 410 Gone (resourceVersion expired): resets to "" and restarts from current state
 * - On other errors: propagates to the caller
 */
export async function* createK8sWatchSubscription(
  watch: Watch,
  options: K8sWatchOptions
): AsyncGenerator<WatchEvent, void, unknown> {
  const { watchUrl, watchOptions, signal } = options;
  let currentResourceVersion = watchOptions.resourceVersion;
  let consecutiveEmptyRestarts = 0;

  while (!signal?.aborted) {
    const queue = createEventQueue<WatchEvent>();
    let controller: Awaited<ReturnType<typeof watch.watch>> | null = null;
    let receivedEvents = false;

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

    let watchPromise: Promise<Awaited<ReturnType<typeof watch.watch>>> | null = null;

    try {
      watchPromise = watch.watch(
        watchUrl,
        { ...watchOptions, resourceVersion: currentResourceVersion },
        (type, obj: KubeObjectBase) => {
          if (type === "ERROR") {
            // 410 Gone arrives as both an ERROR-type watch event and the done callback.
            // Handle it here so ERROR frames never reach subscribers and receivedEvents
            // stays false, keeping the backoff active on the next restart attempt.
            if ((obj as { code?: number }).code === 410) {
              currentResourceVersion = "";
            }
            queue.abort();
            return;
          }
          receivedEvents = true;
          if (obj?.metadata?.resourceVersion) {
            currentResourceVersion = obj.metadata.resourceVersion;
          }
          queue.emit({ type, data: obj });
        },
        (err) => {
          if (!err) {
            queue.abort();
            return;
          }
          const statusCode = readHttpStatus(err);
          if (statusCode === 410) {
            currentResourceVersion = "";
            queue.abort();
            return;
          }
          // handleK8sError maps a K8sApiError by status; a plain Error maps to
          // INTERNAL_SERVER_ERROR and the 404/403 is lost.
          queue.emitError(
            statusCode === undefined
              ? err
              : new K8sApiError(statusCode, (err as { message?: string }).message ?? "", "")
          );
        }
      );

      watchPromise
        .then((c) => {
          controller = c;
        })
        .catch((err) => {
          queue.emitError(err);
        });

      // yieldEvents returns normally when queue is aborted (clean termination).
      // It throws when an error event is queued (via handleK8sError).
      yield* yieldEvents(queue, signal, handleK8sError);
      // Reached here = clean termination → loop continues to restart watch
    } finally {
      // Ensure controller is captured before cleanup, in case watchPromise
      // hasn't resolved yet when the queue is aborted.
      if (watchPromise) {
        try {
          const c = await watchPromise;
          if (!controller) controller = c;
        } catch {
          // Ignore — watchPromise rejection is already handled via queue.emitError
        }
      }
      cleanup();
      if (signal) {
        signal.removeEventListener("abort", cleanup);
      }
    }

    // Skip backoff if already aborted — avoid delaying graceful shutdown.
    if (signal?.aborted) break;

    // Backoff when the watch closes without delivering any events (e.g. K8s API
    // server immediately closes a stream for an edge-case resourceVersion).
    // Prevents rapid reconnect loops. Resets on first successful event delivery.
    if (receivedEvents) {
      consecutiveEmptyRestarts = 0;
    } else {
      consecutiveEmptyRestarts++;
      const delayMs = Math.min(1000 * 2 ** (consecutiveEmptyRestarts - 1), 30_000);
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, delayMs);
        signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            resolve();
          },
          { once: true }
        );
      });
    }
  }
}
