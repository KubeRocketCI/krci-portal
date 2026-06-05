import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import { createLabelSelectorString } from "../../../utils/createLabelSelectorString/index.js";
import { k8sResourceConfigSchema } from "@my-project/shared";
import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";

// Forwarded verbatim to the K8s API server, so constrain to the field-selector
// grammar (comma-separated key(=|==|!=)value pairs). Project convention: regex-
// constrained Zod for filter strings sent to backends (cf. tektonInputSchemas.celFilter).
const K8S_FIELD_SELECTOR_REGEX =
  /^[A-Za-z0-9_.]+(?:==|!=|=)[A-Za-z0-9_./-]*(?:,[A-Za-z0-9_.]+(?:==|!=|=)[A-Za-z0-9_./-]*)*$/;

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
      limit: z.number().int().positive().max(1000).optional(),
      fieldSelector: z.string().max(512).regex(K8S_FIELD_SELECTOR_REGEX, "Invalid fieldSelector").optional(),
    })
  )
  .output(k8sListOutputSchema)
  .query(async ({ input, ctx }) => {
    try {
      const k8sClient = new K8sClient(ctx.session);

      if (!k8sClient.KubeConfig) {
        throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
      }

      const { namespace, resourceConfig, labels, limit, fieldSelector } = input;

      return await k8sClient.listResource(resourceConfig, namespace, createLabelSelectorString(labels), {
        limit,
        fieldSelector,
      });
    } catch (error) {
      throw handleK8sError(error);
    }
  });
