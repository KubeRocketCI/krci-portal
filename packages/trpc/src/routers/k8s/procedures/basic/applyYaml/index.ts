import { handleK8sError } from "../../../utils/handleK8sError/index.js";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { K8sApiError } from "@my-project/shared";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../errors/index.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";

const applyResultSchema = z.object({
  success: z.boolean(),
  kind: z.string().optional(),
  name: z.string().optional(),
  error: z.string().optional(),
});

export type ApplyResult = z.infer<typeof applyResultSchema>;

export const k8sApplyYamlProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      resources: z.array(z.record(z.unknown())),
    })
  )
  .output(z.array(applyResultSchema))
  .mutation(async ({ input, ctx }) => {
    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    const results: ApplyResult[] = [];

    for (const resource of input.resources) {
      const apiVersion = resource["apiVersion"] as string | undefined;
      const kind = resource["kind"] as string | undefined;
      const metadata = resource["metadata"] as
        | { name?: string; namespace?: string; resourceVersion?: string }
        | undefined;

      if (!apiVersion || !kind) {
        results.push({ success: false, error: "Resource is missing apiVersion or kind" });
        continue;
      }

      try {
        const { pluralName, namespaced } = await k8sClient.discoverResource(apiVersion, kind);

        const namespace = namespaced ? metadata?.namespace : undefined;

        const parts = apiVersion.includes("/") ? apiVersion.split("/") : ["", apiVersion];
        const group = parts.length > 1 ? parts[0] : "";
        const version = parts[parts.length - 1];

        const resourceConfig = {
          apiVersion,
          kind,
          group,
          version,
          singularName: kind.toLowerCase(),
          pluralName,
          clusterScoped: !namespaced,
        };

        try {
          await k8sClient.createResource(resourceConfig, namespace, resource as object);
        } catch (createError) {
          // On 409 Conflict, fetch the existing resource to get its resourceVersion, then replace.
          if (createError instanceof K8sApiError && createError.statusCode === 409 && metadata?.name) {
            const existing = await k8sClient.getResource(resourceConfig, metadata.name, namespace);
            const resourceWithVersion = structuredClone(resource);
            (resourceWithVersion["metadata"] as Record<string, unknown>)["resourceVersion"] =
              existing.metadata.resourceVersion;
            await k8sClient.replaceResource(resourceConfig, metadata.name, namespace, resourceWithVersion as object);
          } else {
            throw createError;
          }
        }

        results.push({ success: true, kind, name: metadata?.name });
      } catch (error) {
        const trpcError = handleK8sError(error);
        results.push({ success: false, kind, name: metadata?.name, error: trpcError.message });
      }
    }

    return results;
  });
