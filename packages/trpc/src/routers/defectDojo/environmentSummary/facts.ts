import {
  getStageResourceName,
  k8sApplicationConfig,
  k8sStageConfig,
  type EnvironmentSummaryInput,
} from "@my-project/shared";
import type { CustomSession } from "../../../context/types.js";
import { listOrNull, readAsUser, stageSchema, type FindingsKubeReader } from "../kube.js";
import {
  toPlatformApplications,
  toPlatformStage,
  type PlatformApplication,
  type PlatformStage,
} from "../platformFindings/facts.js";

/** The Kubernetes values the findings of an Environment are joined to DefectDojo by. */
export interface EnvironmentFacts extends PlatformStage {
  /** Every Application of the installation namespace. `null`: not listed (no access, or the type is not served). */
  applications: PlatformApplication[] | null;
}

export async function readEnvironmentFacts(
  reader: FindingsKubeReader,
  { namespace, cdPipeline, stage }: EnvironmentSummaryInput
): Promise<EnvironmentFacts> {
  const [stageObject, applications] = await Promise.all([
    reader.getResource(k8sStageConfig, getStageResourceName(cdPipeline, stage), namespace),
    listOrNull(reader, k8sApplicationConfig, namespace),
  ]);
  return {
    ...toPlatformStage(stageSchema.parse(stageObject)),
    applications: applications && toPlatformApplications(applications),
  };
}

/** Reads the Stage as its page does, by name: a user who cannot read it gets the Kubernetes error. */
export function loadEnvironmentFacts(
  session: CustomSession,
  input: EnvironmentSummaryInput
): Promise<EnvironmentFacts> {
  return readAsUser(session, (reader) => readEnvironmentFacts(reader, input));
}
