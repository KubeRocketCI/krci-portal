import { k8sResourceConfigSchema } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";

// Explicit properties so `trpc-to-openapi` emits typed schemas; downstream
// oapi-codegen clients otherwise drop every extra key on decode.
const k8sItemMetadataSchema = z
  .object({
    name: z.string(),
    namespace: z.string().optional(),
    resourceVersion: z.string().optional(),
    creationTimestamp: z.string().optional(),
    labels: z.record(z.string().optional()).optional(),
    annotations: z.record(z.string()).optional(),
  })
  .passthrough();

const k8sGetOutputSchema = z
  .object({
    apiVersion: z.string(),
    kind: z.string(),
    metadata: k8sItemMetadataSchema,
    spec: z.record(z.unknown()).optional(),
    status: z.record(z.unknown()).optional(),
  })
  .passthrough();

export const k8sGetProcedure = protectedProcedure
  .meta({ openapi: { method: "POST", path: "/v1/resources/get", protect: true, tags: ["k8s"] } })
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string().optional(),
      name: z.string(),
      resourceConfig: k8sResourceConfigSchema,
    })
  )
  .output(k8sGetOutputSchema)
  .query(async ({ input, ctx }) => {
    try {
      const k8sClient = new K8sClient(ctx.session);

      if (!k8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { namespace, name, resourceConfig } = input;

      return await k8sClient.getResource(resourceConfig, name, namespace);
    } catch (error) {
      throw handleK8sError(error);
    }
  });
