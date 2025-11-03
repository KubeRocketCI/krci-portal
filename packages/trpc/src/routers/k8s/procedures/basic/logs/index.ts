import { protectedProcedure } from "../../../../../procedures/protected";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors";
import { handleK8sError } from "../../../utils/handleK8sError";
import * as k8s from "@kubernetes/client-node";
import { PassThrough } from "stream";
import { observable } from "@trpc/server/observable";

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
      const { K8sClient } = ctx;

      if (!K8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const log = new k8s.Log(K8sClient.KubeConfig);
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
  .subscription(({ input, ctx }) => {
    return observable<{ logs: string; type: "data" | "error" | "end" }>((emit) => {
      try {
        const { K8sClient } = ctx;

        if (!K8sClient.KubeConfig) {
          emit.error(new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED));
          return;
        }

        const log = new k8s.Log(K8sClient.KubeConfig);
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
        let isActive = true;

        logStream.on("data", (chunk) => {
          if (isActive) {
            const chunkStr = chunk.toString();
            // Wrap k8s timestamps with [[ ]] for easier frontend parsing
            const modifiedChunk = chunkStr.replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z?)\s+/gm, "[[$1]] ");
            emit.next({ logs: modifiedChunk, type: "data" });
          }
        });

        logStream.on("end", () => {
          if (isActive) {
            emit.next({ logs: "", type: "end" });
          }
        });

        logStream.on("error", (err) => {
          if (isActive) {
            emit.error(handleK8sError(err));
          }
        });

        log
          .log(namespace, podName, container || "", logStream, logOptions)
          .then((req) => {
            request = req;
          })
          .catch((err) => {
            if (isActive) {
              emit.error(handleK8sError(err));
            }
          });

        return () => {
          isActive = false;
          if (request) {
            try {
              request.abort();
            } catch {
              // Ignore abort errors
            }
          }
          logStream.destroy();
        };
      } catch (error) {
        emit.error(handleK8sError(error));
        return () => {};
      }
    });
  });
