import { k8sCodebaseConfig, k8sStageConfig } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { TRPCContext } from "../../context/types.js";
import { getResourceOrThrowNotFound } from "../pipelineRun/lookup.js";
import { getInitializedK8sClient } from "../k8s/utils/getInitializedK8sClient/index.js";
import { handleK8sError } from "../k8s/utils/handleK8sError/index.js";

const stageIdentitySchema = z.object({
  spec: z.object({ cdPipeline: z.string(), name: z.string() }),
});

export interface AuthorizedStage {
  cdPipeline: string;
  stage: string;
}

export function getPortalNamespace(): string {
  const namespace = process.env.DEFAULT_CLUSTER_NAMESPACE;

  if (!namespace) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "DEFAULT_CLUSTER_NAMESPACE environment variable is not configured",
    });
  }

  return namespace;
}

/**
 * Reads the Codebase with the caller's own credentials. Fails when the caller cannot see it, so no
 * security data of a codebase leaves the portal for a caller without access to the codebase.
 */
export async function authorizeCodebase(ctx: Pick<TRPCContext, "session">, codebase: string): Promise<void> {
  const k8sClient = getInitializedK8sClient(ctx);
  const namespace = getPortalNamespace();

  await getResourceOrThrowNotFound(
    () => k8sClient.getResource(k8sCodebaseConfig, codebase, namespace),
    `codebase '${codebase}' not found`,
    "codebase_not_found"
  );
}

/**
 * Reads the Stage with the caller's own credentials and returns the CD pipeline and stage names of
 * its spec. Fails when the caller cannot see the Stage or when the names do not describe it.
 */
export async function authorizeStage(
  ctx: Pick<TRPCContext, "session">,
  cdPipeline: string,
  stage: string
): Promise<AuthorizedStage> {
  const k8sClient = getInitializedK8sClient(ctx);
  const namespace = getPortalNamespace();
  const name = `${cdPipeline}-${stage}`;

  let resource;
  try {
    resource = await k8sClient.getResource(k8sStageConfig, name, namespace);
  } catch (error) {
    throw handleK8sError(error);
  }

  const parsed = stageIdentitySchema.safeParse(resource);

  // Stage `a-b-c` is `a-b`/`c` and `a`/`b-c` alike; only the spec tells which one it is.
  if (!parsed.success || parsed.data.spec.cdPipeline !== cdPipeline || parsed.data.spec.name !== stage) {
    throw new TRPCError({ code: "NOT_FOUND", message: `stage '${stage}' of CD pipeline '${cdPipeline}' not found` });
  }

  return { cdPipeline: parsed.data.spec.cdPipeline, stage: parsed.data.spec.name };
}
