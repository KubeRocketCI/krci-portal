import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import * as k8s from "@kubernetes/client-node";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { createEventQueue, yieldEvents } from "../../../utils/createEventQueue/index.js";
import { execSessionManager } from "./sessionManager.js";
import { randomUUID } from "crypto";

export const k8sPodExecProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      podName: z.string(),
      container: z.string().optional(),
      command: z.array(z.string()).default(["/bin/sh"]),
      stdin: z.boolean().default(true),
      stdout: z.boolean().default(true),
      stderr: z.boolean().default(true),
      tty: z.boolean().default(true),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      const k8sClient = new K8sClient(ctx.session);

      if (!k8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { namespace, podName, container, command, stdin, stdout, stderr, tty } = input;

      const exec = new k8s.Exec(k8sClient.KubeConfig);

      return new Promise((resolve, reject) => {
        exec
          .exec(
            namespace,
            podName,
            container || "",
            command,
            stdout ? process.stdout : null,
            stderr ? process.stderr : null,
            stdin ? process.stdin : null,
            tty,
            (status) => {
              resolve({
                success: true,
                exitCode: status.status,
              });
            }
          )
          .catch(reject);
      });
    } catch (error) {
      throw handleK8sError(error);
    }
  });

export const k8sPodAttachProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      podName: z.string(),
      container: z.string().optional(),
      stdin: z.boolean().default(true),
      stdout: z.boolean().default(true),
      stderr: z.boolean().default(true),
      tty: z.boolean().default(true),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      const k8sClient = new K8sClient(ctx.session);

      if (!k8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { namespace, podName, container, stdin, stdout, stderr, tty } = input;

      const exec = new k8s.Exec(k8sClient.KubeConfig);

      return new Promise((resolve, reject) => {
        exec
          .exec(
            namespace,
            podName,
            container || "",
            [],
            stdout ? process.stdout : null,
            stderr ? process.stderr : null,
            stdin ? process.stdin : null,
            tty,
            (status) => {
              resolve({
                success: true,
                exitCode: status.status,
              });
            }
          )
          .catch(reject);
      });
    } catch (error) {
      throw handleK8sError(error);
    }
  });

// WebSocket-based exec subscription for browser clients
export const k8sWatchPodExecProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      podName: z.string(),
      container: z.string().optional(),
      command: z.array(z.string()).default(["/bin/sh"]),
      tty: z.boolean().default(true),
    })
  )
  .subscription(async function* ({ input, ctx, signal }) {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const { namespace, podName, container, command, tty } = input;
    const sessionId = randomUUID();

    // Create session with streams
    const session = execSessionManager.createSession(sessionId, namespace, podName, container);

    type ExecEvent =
      | { type: "sessionId"; sessionId: string }
      | { type: "data"; channel: number; data: string }
      | { type: "exit"; exitCode: number }
      | { type: "error"; message: string };

    const queue = createEventQueue<ExecEvent>();

    // Emit session ID first so client can send input
    queue.emit({ type: "sessionId", sessionId });

    const cleanup = () => {
      queue.abort();
      session.cleanup();
    };

    if (signal) {
      signal.addEventListener("abort", cleanup);
    }

    try {
      const exec = new k8s.Exec(k8sClient.KubeConfig);

      // Set up stream handlers
      session.stdoutStream.on("data", (chunk) => {
        queue.emit({ type: "data", channel: 1, data: chunk.toString() });
      });

      session.stderrStream.on("data", (chunk) => {
        queue.emit({ type: "data", channel: 2, data: chunk.toString() });
      });

      // Execute command
      const execPromise = exec.exec(
        namespace,
        podName,
        container || "",
        command,
        session.stdoutStream,
        session.stderrStream,
        session.stdinStream,
        tty,
        (status) => {
          const exitCode = typeof status.status === "number" ? status.status : parseInt(String(status.status), 10) || 0;
          queue.emit({ type: "exit", exitCode });
        }
      );

      execPromise
        .then((ws) => {
          session.websocket = ws;
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

// WebSocket-based attach subscription for browser clients
export const k8sWatchPodAttachProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
      podName: z.string(),
      container: z.string().optional(),
      tty: z.boolean().default(true),
    })
  )
  .subscription(async function* ({ input, ctx, signal }) {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const { namespace, podName, container, tty } = input;
    const sessionId = randomUUID();

    const session = execSessionManager.createSession(sessionId, namespace, podName, container);

    type AttachEvent =
      | { type: "sessionId"; sessionId: string }
      | { type: "data"; channel: number; data: string }
      | { type: "exit"; exitCode: number }
      | { type: "error"; message: string };

    const queue = createEventQueue<AttachEvent>();

    // Emit session ID first
    queue.emit({ type: "sessionId", sessionId });

    const cleanup = () => {
      queue.abort();
      session.cleanup();
    };

    if (signal) {
      signal.addEventListener("abort", cleanup);
    }

    try {
      const exec = new k8s.Exec(k8sClient.KubeConfig);

      // Set up stream handlers
      session.stdoutStream.on("data", (chunk) => {
        queue.emit({ type: "data", channel: 1, data: chunk.toString() });
      });

      session.stderrStream.on("data", (chunk) => {
        queue.emit({ type: "data", channel: 2, data: chunk.toString() });
      });

      // Attach to container (no command)
      const execPromise = exec.exec(
        namespace,
        podName,
        container || "",
        [],
        session.stdoutStream,
        session.stderrStream,
        session.stdinStream,
        tty,
        (status) => {
          const exitCode = typeof status.status === "number" ? status.status : parseInt(String(status.status), 10) || 0;
          queue.emit({ type: "exit", exitCode });
        }
      );

      execPromise
        .then((ws) => {
          session.websocket = ws;
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

// Send input to an active exec session
export const k8sPodExecSendInputProcedure = protectedProcedure
  .input(
    z.object({
      sessionId: z.string(),
      data: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const { sessionId, data } = input;
    const success = execSessionManager.sendToStdin(sessionId, data);

    if (!success) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Exec session not found",
      });
    }

    return { success: true };
  });

// Resize terminal for an active exec session
export const k8sPodExecResizeProcedure = protectedProcedure
  .input(
    z.object({
      sessionId: z.string(),
      cols: z.number(),
      rows: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const { sessionId, cols, rows } = input;
    const success = execSessionManager.resizeTerminal(sessionId, cols, rows);

    if (!success) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Exec session not found",
      });
    }

    return { success: true };
  });
