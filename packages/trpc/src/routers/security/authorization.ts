import {
  codebaseImageStreamSpecSchema,
  k8sCDPipelineConfig,
  k8sCodebaseConfig,
  k8sCodebaseImageStreamConfig,
  k8sStageConfig,
  stageLabels,
} from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { z, type ZodType } from "zod";
import type { TRPCContext } from "../../context/types.js";
import { getResourceOrThrowNotFound, listCompleteOrThrow } from "../pipelineRun/lookup.js";
import { getInitializedK8sClient } from "../k8s/utils/getInitializedK8sClient/index.js";
import { validationCause } from "../../utils/restErrorReason/index.js";

const readableStageSchema = z.object({
  spec: z.object({
    cdPipeline: z.string(),
    name: z.string(),
    namespace: z.string().optional(),
    clusterName: z.string().optional(),
  }),
  status: z.object({ available: z.boolean().optional() }).nullish(),
});

const readableCdPipelineSchema = z.object({
  metadata: z.object({ name: z.string() }),
  spec: z.object({ applications: z.array(z.string()).nullish() }),
});

const readableImageStreamSchema = z.object({
  spec: codebaseImageStreamSpecSchema.pick({ codebase: true, imageName: true }),
});

/** A Stage the caller can read, as its spec and status describe it. */
export interface AuthorizedStage {
  cdPipeline: string;
  stage: string;
  /** `spec.clusterName`; empty when the Stage names none. */
  clusterName: string;
  /** `spec.namespace`; empty when the Stage names none. */
  namespace: string;
  /** `status.available`: the provisioning of the Stage has finished. */
  available: boolean;
}

/** The codebase and image name of a CodebaseImageStream. */
export type ImageStream = z.infer<typeof readableImageStreamSchema>;

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
 * Reads the Stage with the caller's own credentials and returns what its spec and status say about it.
 * Fails when the caller cannot see the Stage or when the names do not describe it.
 */
export async function authorizeStage(
  ctx: Pick<TRPCContext, "session">,
  cdPipeline: string,
  stage: string
): Promise<AuthorizedStage> {
  const k8sClient = getInitializedK8sClient(ctx);
  const namespace = getPortalNamespace();
  const name = `${cdPipeline}-${stage}`;
  const notFound = `stage '${stage}' of CD pipeline '${cdPipeline}' not found`;

  const resource = await getResourceOrThrowNotFound(
    () => k8sClient.getResource(k8sStageConfig, name, namespace),
    notFound,
    "stage_not_found"
  );

  const parsed = readableStageSchema.safeParse(resource);

  // Stage `a-b-c` is `a-b`/`c` and `a`/`b-c` alike; only the spec tells which one it is.
  if (!parsed.success || parsed.data.spec.cdPipeline !== cdPipeline || parsed.data.spec.name !== stage) {
    throw new TRPCError({ code: "NOT_FOUND", message: notFound, cause: validationCause("stage_not_found") });
  }

  return toAuthorizedStage(parsed.data);
}

/**
 * The Stages of the CD pipelines that deploy the codebase, as far as the caller can read them.
 * Empty when the caller may not list CD pipelines or Stages.
 */
export async function listCodebaseEnvironments(
  ctx: Pick<TRPCContext, "session">,
  codebase: string
): Promise<AuthorizedStage[]> {
  const k8sClient = getInitializedK8sClient(ctx);
  const namespace = getPortalNamespace();

  const stages = await listReadable(async () => {
    const cdPipelines = parseAll(
      readableCdPipelineSchema,
      await listCompleteOrThrow<unknown>(k8sClient, k8sCDPipelineConfig, namespace, "")
    );

    const names = cdPipelines
      .filter((cdPipeline) => cdPipeline.spec.applications?.includes(codebase))
      .map((cdPipeline) => cdPipeline.metadata.name);

    if (names.length === 0) {
      return [];
    }

    const stageResources = await listCompleteOrThrow<unknown>(
      k8sClient,
      k8sStageConfig,
      namespace,
      `${stageLabels.cdPipeline} in (${names.join(",")})`
    );

    return parseAll(readableStageSchema, stageResources)
      .filter((stage) => names.includes(stage.spec.cdPipeline))
      .map(toAuthorizedStage);
  });

  return stages ?? [];
}

/** The CodebaseImageStreams of the portal namespace; undefined when the caller may not list them. */
export async function listCodebaseImageStreams(ctx: Pick<TRPCContext, "session">): Promise<ImageStream[] | undefined> {
  const k8sClient = getInitializedK8sClient(ctx);
  const namespace = getPortalNamespace();

  const streams = await listReadable(() =>
    listCompleteOrThrow<unknown>(k8sClient, k8sCodebaseImageStreamConfig, namespace, "")
  );

  return streams && parseAll(readableImageStreamSchema, streams);
}

function toAuthorizedStage({ spec, status }: z.infer<typeof readableStageSchema>): AuthorizedStage {
  return {
    cdPipeline: spec.cdPipeline,
    stage: spec.name,
    clusterName: spec.clusterName ?? "",
    namespace: spec.namespace ?? "",
    available: status?.available === true,
  };
}

function parseAll<T>(schema: ZodType<T>, items: readonly unknown[]): T[] {
  return items.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/** The result of `list`, or undefined when the caller is not allowed to list the resource. */
async function listReadable<T>(list: () => Promise<T[]>): Promise<T[] | undefined> {
  try {
    return await list();
  } catch (error) {
    if (error instanceof TRPCError && error.code === "FORBIDDEN") {
      return undefined;
    }

    throw error;
  }
}
