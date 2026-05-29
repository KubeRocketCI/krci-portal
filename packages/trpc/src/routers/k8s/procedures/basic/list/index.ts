import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { z } from "zod";
import { createLabelSelectorString } from "../../../utils/createLabelSelectorString/index.js";
import { k8sResourceConfigSchema } from "@my-project/shared";
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

const k8sListOutputSchema = z.object({
  apiVersion: z.string(),
  kind: z.string(),
  metadata: z.record(z.unknown()),
  items: z.array(
    z
      .object({
        apiVersion: z.string().optional(),
        kind: z.string().optional(),
        metadata: k8sItemMetadataSchema,
        spec: z.record(z.unknown()).optional(),
        status: z.record(z.unknown()).optional(),
      })
      .passthrough()
  ),
});

export const k8sListProcedure = protectedProcedure
  .meta({ openapi: { method: "POST", path: "/v1/resources/list", protect: true, tags: ["k8s"] } })
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string().optional(),
      resourceConfig: k8sResourceConfigSchema,
      labels: z.record(z.string()).optional().default({}),
    })
  )
  .output(k8sListOutputSchema)
  .query(async ({ input, ctx }) => {
    try {
      const k8sClient = getInitializedK8sClient(ctx);

      const { namespace, resourceConfig, labels } = input;

      return await k8sClient.listResource(resourceConfig, namespace, createLabelSelectorString(labels));
    } catch (error) {
      throw rethrowOrHandleK8sError(error);
    }
  });
