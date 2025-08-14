import { protectedProcedure } from "@/trpc/procedures/protected";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors";
import { handleK8sError } from "@/trpc/routers/k8s/utils/handleK8sError";
import * as k8s from "@kubernetes/client-node";

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
      const { K8sClient } = ctx;

      if (!K8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const {
        namespace,
        podName,
        container,
        command,
        stdin,
        stdout,
        stderr,
        tty,
      } = input;

      const exec = new k8s.Exec(K8sClient.KubeConfig);

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
      const { K8sClient } = ctx;

      if (!K8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { namespace, podName, container, stdin, stdout, stderr, tty } =
        input;

      const exec = new k8s.Exec(K8sClient.KubeConfig);

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
