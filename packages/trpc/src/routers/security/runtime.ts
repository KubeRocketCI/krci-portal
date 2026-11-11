import type {
  DefectDojoClient,
  DefectDojoFindingsFilter,
  DefectDojoTest,
  DefectDojoTestsResult,
  NamespaceRef,
} from "../../clients/defectdojo/index.js";
import { imageTagOf, ociImageTag, workloadsOf } from "../../clients/defectdojo/tags.js";
import type { TRPCContext } from "../../context/types.js";
import { mapWithConcurrency } from "../../utils/mapWithConcurrency/index.js";
import {
  getPortalNamespace,
  listCodebaseEnvironments,
  listCodebaseImageStreams,
  type AuthorizedStage,
  type ImageStream,
} from "./authorization.js";
import { DEFECTDOJO_CONCURRENCY, sortedCopy, sortedUnique } from "./engagements.js";

/** The namespace product of an environment. */
export interface EnvironmentTarget extends NamespaceRef {
  /** `<cdPipeline>/<stage>` */
  environment: string;
}

/** `oci-image:` tags of the images of each codebase. */
export type ImagesByCodebase = ReadonlyMap<string, ReadonlySet<string>>;

/** What the runtime part of a summary reads from Kubernetes with the caller's token and from the settings. */
export interface RuntimeContext {
  /** Undefined when the caller may not list the image streams. */
  images: ImagesByCodebase | undefined;
  /** Tags every runtime test must carry: the tag of the tenant label of the namespace, none while no label is set. */
  tenantTags: readonly string[];
}

export interface RuntimeInput extends RuntimeContext {
  /** The Stages of the codebase the caller can read. */
  stages: readonly AuthorizedStage[];
}

/** The runtime tests of the namespace of one environment. */
export interface NamespaceRuntime extends DefectDojoTestsResult {
  target: EnvironmentTarget;
}

export interface ClassifiedTests {
  /** Tests that run an image of the codebase. A test of an image that two codebases share is in both. */
  byCodebase: Map<string, DefectDojoTest[]>;
  /** Tests of any other image, and tests that name no image. */
  other: DefectDojoTest[];
}

/** `<cdPipeline>/<stage>` */
export function environmentName(stage: Pick<AuthorizedStage, "cdPipeline" | "stage">): string {
  return `${stage.cdPipeline}/${stage.stage}`;
}

/** The namespace product of the Stage; undefined while the Stage is not available or has no plain namespace name. */
export function resolveEnvironmentTarget(
  stage: AuthorizedStage,
  client: Pick<DefectDojoClient, "namespaceRef">
): EnvironmentTarget | undefined {
  const ref = stage.available ? client.namespaceRef(stage.clusterName, stage.namespace) : undefined;
  return ref && { ...ref, environment: environmentName(stage) };
}

/** The namespace products of the Stages that have one to read, ordered by environment. */
export function resolveEnvironmentTargets(
  stages: readonly AuthorizedStage[],
  client: Pick<DefectDojoClient, "namespaceRef">
): EnvironmentTarget[] {
  const targets = stages.flatMap((stage) => {
    const target = resolveEnvironmentTarget(stage, client);
    return target ? [target] : [];
  });

  return sortedCopy(targets, (target) => target.environment);
}

/** The `oci-image:` tags of the images of the image streams, by codebase. A stream without an image name is left out. */
export function imagesByCodebase(streams: readonly ImageStream[]): ImagesByCodebase {
  const images = new Map<string, Set<string>>();

  for (const { spec } of streams) {
    const tag = ociImageTag(spec.imageName);
    if (tag) {
      images.set(spec.codebase, (images.get(spec.codebase) ?? new Set<string>()).add(tag));
    }
  }

  return images;
}

/** The images of the codebases and the tenant tags, as far as the caller can read them. */
export async function loadRuntimeContext(
  ctx: Pick<TRPCContext, "session">,
  client: Pick<DefectDojoClient, "tenantTags">
): Promise<RuntimeContext> {
  const streams = await listCodebaseImageStreams(ctx);

  return { images: streams && imagesByCodebase(streams), tenantTags: client.tenantTags(getPortalNamespace()) };
}

/** The runtime context and the Stages of the codebase. */
export async function loadRuntimeInput(
  ctx: Pick<TRPCContext, "session">,
  client: Pick<DefectDojoClient, "tenantTags">,
  codebase: string
): Promise<RuntimeInput> {
  const [stages, context] = await Promise.all([
    listCodebaseEnvironments(ctx, codebase),
    loadRuntimeContext(ctx, client),
  ]);

  return { ...context, stages };
}

export function testsRunningImages(tests: readonly DefectDojoTest[], imageTags: ReadonlySet<string>): DefectDojoTest[] {
  return tests.filter((test) => {
    const image = imageTagOf(test.tags);
    return image !== undefined && imageTags.has(image);
  });
}

/** Sorts the tests into the codebases whose images they run, and the rest. */
export function classifyTests(tests: readonly DefectDojoTest[], images: ImagesByCodebase): ClassifiedTests {
  const byCodebase = new Map<string, DefectDojoTest[]>();

  for (const [codebase, imageTags] of images) {
    const codebaseTests = testsRunningImages(tests, imageTags);
    if (codebaseTests.length > 0) {
      byCodebase.set(codebase, codebaseTests);
    }
  }

  const classified = new Set([...byCodebase.values()].flat());

  return { byCodebase, other: tests.filter((test) => !classified.has(test)) };
}

/** The namespaces of the targets that hold runtime tests; a namespace without tests is left out. */
export async function loadNamespaceRuntimes(
  client: DefectDojoClient,
  targets: readonly EnvironmentTarget[],
  tenantTags: readonly string[]
): Promise<NamespaceRuntime[]> {
  const loaded = await mapWithConcurrency(targets, DEFECTDOJO_CONCURRENCY, async (target) => ({
    target,
    ...(await client.listNamespaceTests(target, tenantTags)),
  }));

  return loaded.filter(({ tests }) => tests.length > 0);
}

export function engagementIdsOf(tests: readonly DefectDojoTest[]): number[] {
  return [...new Set(tests.map((test) => test.engagement))].sort((a, b) => a - b);
}

export function imageTagsOf(tests: readonly DefectDojoTest[]): string[] {
  return sortedUnique(tests.flatMap((test) => imageTagOf(test.tags) ?? []));
}

/** The findings of the tests of one codebase. */
export function codebaseFindingsFilter(
  tests: readonly DefectDojoTest[],
  tenantTags: readonly string[]
): DefectDojoFindingsFilter {
  return { engagementIds: engagementIdsOf(tests), anyTestTags: imageTagsOf(tests), allTestTags: tenantTags };
}

/** The findings of the tests that belong to no codebase: those of the namespace without the tests of `codebaseTests`. */
export function otherFindingsFilter(
  otherTests: readonly DefectDojoTest[],
  codebaseTests: readonly DefectDojoTest[],
  tenantTags: readonly string[]
): DefectDojoFindingsFilter {
  return {
    engagementIds: engagementIdsOf(otherTests),
    excludeTestTags: imageTagsOf(codebaseTests),
    allTestTags: tenantTags,
  };
}

/** The engagement of the namespace, or its product when the tests are spread over several engagements. */
export function namespaceLink(client: DefectDojoClient, { engagements }: NamespaceRuntime): string {
  const [engagement, ...more] = engagements.values();
  return more.length === 0 ? client.engagementUrl(engagement.id) : client.productUrl(engagement.product.id);
}

/** `<kind>/<name>` of the workloads of the tests, sorted. */
export function workloadsOfTests(tests: readonly DefectDojoTest[]): string[] {
  return sortedUnique(tests.flatMap((test) => workloadsOf(test.tags)));
}
