import { K8sApiError, inClusterName, type K8sResourceConfig } from "@my-project/shared";
import { z } from "zod";
import type { CustomSession } from "../../context/types.js";
import { getInitializedK8sClient } from "../k8s/utils/getInitializedK8sClient/index.js";
import { rethrowOrHandleK8sError } from "../k8s/utils/handleK8sError/index.js";

/** What the security procedures read from Kubernetes. `K8sClient` fits it. */
export interface FindingsKubeReader {
  getResource(config: K8sResourceConfig, name: string, namespace: string): Promise<unknown>;
  listResource(config: K8sResourceConfig, namespace: string, labelSelector?: string): Promise<{ items: unknown[] }>;
}

export const applicationSchema = z.object({
  metadata: z.object({ name: z.string(), labels: z.record(z.string()).optional() }),
});

export const stageSchema = z.object({
  spec: z.object({
    cdPipeline: z.string(),
    name: z.string(),
    clusterName: z.string().default(inClusterName),
    namespace: z.string(),
    order: z.number().int(),
  }),
});

export const codebaseSchema = z.object({
  metadata: z.object({ name: z.string() }),
  spec: z.object({ defaultBranch: z.string() }),
});

export const codebaseBranchSchema = z.object({ spec: z.object({ codebaseName: z.string(), branchName: z.string() }) });

export const codebaseImageStreamSchema = z.object({ spec: z.object({ codebase: z.string(), imageName: z.string() }) });

export type Application = z.output<typeof applicationSchema>;
export type Stage = z.output<typeof stageSchema>;

export function parseAll<Output>(schema: z.ZodType<Output, z.ZodTypeDef, unknown>, items: unknown[]): Output[] {
  return items.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Identity of a Stage by its CDPipeline and `spec.name`, as an Application's labels name it. */
export function stageKey(cdPipeline: string, stage: string): string {
  return JSON.stringify([cdPipeline, stage]);
}

/** The order Environments are shown in. */
export function compareStages(a: Stage, b: Stage): number {
  return (
    a.spec.cdPipeline.localeCompare(b.spec.cdPipeline) ||
    a.spec.order - b.spec.order ||
    a.spec.name.localeCompare(b.spec.name)
  );
}

/** Runs `read` with a client of the signed-in user's access; a Kubernetes error it throws becomes a tRPC error. */
export async function readAsUser<T>(
  session: CustomSession,
  read: (reader: FindingsKubeReader) => Promise<T>
): Promise<T> {
  try {
    return await read(getInitializedK8sClient({ session }));
  } catch (error) {
    return rethrowOrHandleK8sError(error);
  }
}

/** The items, or `null` when the cluster does not serve the type (404) or the user may not list it (403). */
export async function listOrNull(
  reader: FindingsKubeReader,
  config: K8sResourceConfig,
  namespace: string,
  labelSelector?: string
): Promise<unknown[] | null> {
  try {
    return (await reader.listResource(config, namespace, labelSelector)).items;
  } catch (error) {
    if (error instanceof K8sApiError && (error.statusCode === 404 || error.statusCode === 403)) {
      return null;
    }
    throw error;
  }
}

/**
 * Argo CD and the CD pipeline operator are optional, and the user may not be allowed to list their types: a 404 or a
 * 403 on such a list is an empty list.
 */
export async function listIfReadable(
  reader: FindingsKubeReader,
  config: K8sResourceConfig,
  namespace: string,
  labelSelector?: string
): Promise<{ items: unknown[] }> {
  return { items: (await listOrNull(reader, config, namespace, labelSelector)) ?? [] };
}
