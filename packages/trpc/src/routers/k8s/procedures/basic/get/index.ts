import { k8sResourceConfigSchema } from "@my-project/shared";
import { z } from "zod";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { rethrowOrHandleK8sError } from "../../../utils/handleK8sError/index.js";
import { getInitializedK8sClient } from "../../../utils/getInitializedK8sClient/index.js";

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
      const k8sClient = getInitializedK8sClient(ctx);

      const { namespace, name, resourceConfig } = input;

      return await k8sClient.getResource(resourceConfig, name, namespace);
    } catch (error) {
      throw rethrowOrHandleK8sError(error);
    }
  });
