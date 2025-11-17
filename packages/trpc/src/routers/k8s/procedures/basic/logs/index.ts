import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import * as k8s from "@kubernetes/client-node";
import { PassThrough } from "stream";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { createEventQueue, yieldEvents } from "../../../utils/createEventQueue/index.js";

export const k8sPodLogsProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      podName: z.string(),
      container: z.string().optional(),
      follow: z.boolean().default(false),
      tailLines: z.number().optional(),
      timestamps: z.boolean().default(false),
      previous: z.boolean().default(false),
      sinceTime: z.string().optional(),
    })
  )
  .query(async ({ input, ctx }) => {
    try {
      const k8sClient = new K8sClient(ctx.session);

      if (!k8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const log = new k8s.Log(k8sClient.KubeConfig);
      const { namespace, podName, container, tailLines, previous, sinceTime } = input;

      const logOptions: k8s.LogOptions = {
        follow: false, // For .query(), we don't want to follow, just get current logs
        pretty: false,
        timestamps: true, // Always get timestamps from k8s
        previous,
      };

      if (tailLines) {
        logOptions.tailLines = tailLines;
      }

      if (sinceTime) {
        logOptions.sinceTime = sinceTime;
      }

      const logStream = new PassThrough();
      let logs = "";

      logStream.on("data", (chunk) => {
        const chunkStr = chunk.toString();
        // Wrap k8s timestamps with [[ ]] for easier frontend parsing
        const modifiedChunk = chunkStr.replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z?)\s+/gm, "[[$1]] ");
        logs += modifiedChunk;
      });

      return new Promise<{ logs: string }>((resolve, reject) => {
        log
          .log(namespace, podName, container || "", logStream, logOptions)
          .then(() => {
            logStream.end();
            resolve({ logs });
          })
          .catch((err) => {
            reject(handleK8sError(err));
          });

        logStream.on("end", () => {
          resolve({ logs });
        });

        logStream.on("error", (err) => {
          reject(handleK8sError(err));
        });
      });
    } catch (error) {
      throw handleK8sError(error);
    }
  });

export const k8sWatchPodLogsProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      podName: z.string(),
      container: z.string().optional(),
      follow: z.boolean().default(true),
      tailLines: z.number().optional(),
      timestamps: z.boolean().default(false),
      previous: z.boolean().default(false),
      sinceTime: z.string().optional(),
    })
  )
  .subscription(async function* ({ input, ctx, signal }) {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const log = new k8s.Log(k8sClient.KubeConfig);
    const { namespace, podName, container, follow, tailLines, previous, sinceTime } = input;

    const logOptions: k8s.LogOptions = {
      follow,
      pretty: false,
      timestamps: true, // Always get timestamps from k8s
      previous,
    };

    if (tailLines) {
      logOptions.tailLines = tailLines;
    }

    if (sinceTime) {
      logOptions.sinceTime = sinceTime;
    }

    const logStream = new PassThrough();
    let request: AbortController | undefined;

    type LogEvent = { logs: string; type: "data" | "end" };
    const queue = createEventQueue<LogEvent>();

    // Cleanup function
    const cleanup = () => {
      queue.abort();
      if (request) {
        try {
          request.abort();
        } catch {
          // Ignore abort errors
        }
      }
      logStream.destroy();
    };

    // Handle abort signal
    if (signal) {
      signal.addEventListener("abort", cleanup);
    }

    try {
      // Set up stream event handlers
      logStream.on("data", (chunk) => {
        const chunkStr = chunk.toString();
        // Wrap k8s timestamps with [[ ]] for easier frontend parsing
        const modifiedChunk = chunkStr.replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z?)\s+/gm, "[[$1]] ");
        queue.emit({ logs: modifiedChunk, type: "data" });
      });

      logStream.on("end", () => {
        queue.emit({ logs: "", type: "end" });
      });

      logStream.on("error", (err) => {
        queue.emitError(err);
      });

      // Start the log stream
      const logPromise = log.log(namespace, podName, container || "", logStream, logOptions);

      logPromise
        .then((req) => {
          request = req;
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
  });
