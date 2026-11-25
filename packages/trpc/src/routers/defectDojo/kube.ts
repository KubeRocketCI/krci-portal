import { K8sApiError, inClusterName, type K8sResourceConfig } from "@my-project/shared";
import { z } from "zod";

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

/** Argo CD and the CD pipeline operator are optional: a 404 on their types is an empty list. */
export async function listIfServed(
  reader: FindingsKubeReader,
  config: K8sResourceConfig,
  namespace: string,
  labelSelector?: string
): Promise<{ items: unknown[] }> {
  try {
    return await reader.listResource(config, namespace, labelSelector);
  } catch (error) {
    if (error instanceof K8sApiError && error.statusCode === 404) {
      return { items: [] };
    }
    throw error;
  }
}

export async function listIfReadable(
  reader: FindingsKubeReader,
  config: K8sResourceConfig,
  namespace: string
): Promise<{ items: unknown[] }> {
  try {
    return await listIfServed(reader, config, namespace);
  } catch (error) {
    if (error instanceof K8sApiError && error.statusCode === 403) {
      return { items: [] };
    }
    throw error;
  }
}
