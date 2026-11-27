import { applicationLabels, k8sApplicationConfig, k8sStageConfig } from "@my-project/shared";
import { toTagCase } from "../../../clients/defectDojo/index.js";
import type { CustomSession } from "../../../context/types.js";
import {
  applicationSchema,
  compareStages,
  listIfReadable,
  parseAll,
  readAsUser,
  stageSchema,
  type FindingsKubeReader,
  type Stage,
} from "../kube.js";

export interface PlatformStage {
  cdPipeline: string;
  stage: string;
  /** `spec.clusterName` in `toTagCase`, the case of the `k8s-cluster` tag it is compared with. */
  clusterName: string;
  namespace: string;
}

/** An Argo CD Application of the installation, with the codebase and the Stage its labels name. */
export interface PlatformApplication {
  name: string;
  codebase: string | null;
  cdPipeline: string | null;
  stage: string | null;
}

/**
 * What the platform lists read from Kubernetes: Stages and Applications decorate rows and set the default clusters.
 * A type the cluster does not serve (404) or the user may not list (403) reads as empty.
 */
export interface PlatformFacts {
  /** Ordered by CDPipeline, then by the order of the Stage, then by its name. */
  stages: PlatformStage[];
  applications: PlatformApplication[];
}

export function toPlatformStage({ spec }: Stage): PlatformStage {
  return {
    cdPipeline: spec.cdPipeline,
    stage: spec.name,
    clusterName: toTagCase(spec.clusterName),
    namespace: spec.namespace,
  };
}

export function toPlatformApplications(items: unknown[]): PlatformApplication[] {
  return parseAll(applicationSchema, items).map(({ metadata }) => ({
    name: metadata.name,
    codebase: metadata.labels?.[applicationLabels.appName] ?? null,
    cdPipeline: metadata.labels?.[applicationLabels.pipeline] ?? null,
    stage: metadata.labels?.[applicationLabels.stage] ?? null,
  }));
}

export async function readPlatformFacts(
  reader: FindingsKubeReader,
  namespace: string,
  { applications = false }: { applications?: boolean } = {}
): Promise<PlatformFacts> {
  const [stageList, applicationList] = await Promise.all([
    listIfReadable(reader, k8sStageConfig, namespace),
    applications ? listIfReadable(reader, k8sApplicationConfig, namespace) : { items: [] },
  ]);

  return {
    stages: parseAll(stageSchema, stageList.items).sort(compareStages).map(toPlatformStage),
    applications: toPlatformApplications(applicationList.items),
  };
}

export function loadPlatformFacts(
  session: CustomSession,
  namespace: string,
  options?: { applications?: boolean }
): Promise<PlatformFacts> {
  return readAsUser(session, (reader) => readPlatformFacts(reader, namespace, options));
}

/** The facts of a Code or Image list: it reads no Kubernetes object. */
export const NO_PLATFORM_FACTS: PlatformFacts = { stages: [], applications: [] };

export function sortedUnique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function clustersOfStages(facts: Pick<PlatformFacts, "stages">): string[] {
  return sortedUnique(facts.stages.map((stage) => stage.clusterName));
}

/** The clusters a Runtime list without `clusters` covers: the Stage clusters; `null` without a Stage, every cluster. */
export function defaultRuntimeClusters(facts: Pick<PlatformFacts, "stages">): string[] | null {
  const clusters = clustersOfStages(facts);
  return clusters.length > 0 ? clusters : null;
}
