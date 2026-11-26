import { k8sCodebaseBranchConfig, k8sCodebaseConfig, k8sCodebaseImageStreamConfig } from "@my-project/shared";
import type { CustomSession } from "../../../context/types.js";
import { groupBy } from "../../../utils/groupBy/index.js";
import {
  codebaseBranchSchema,
  codebaseImageStreamSchema,
  codebaseSchema,
  listOrNull,
  parseAll,
  readAsUser,
  type FindingsKubeReader,
} from "../kube.js";

/**
 * The Codebases of the tenant namespace as the signed-in user reads them. `null`: the type is not served (404) or the
 * user may not list it (403).
 */
export interface TenantFacts {
  /** `spec.defaultBranch` of each Codebase, by its name. */
  defaultBranches: ReadonlyMap<string, string> | null;
  /** `spec.branchName` of the CodebaseBranches, by `spec.codebaseName`. */
  branches: ReadonlyMap<string, string[]> | null;
  /** `spec.imageName` of the CodebaseImageStreams, by `spec.codebase`. */
  ownImageNames: ReadonlyMap<string, string[]> | null;
}

export async function readTenantFacts(reader: FindingsKubeReader, namespace: string): Promise<TenantFacts> {
  const [codebases, branches, imageStreams] = await Promise.all([
    listOrNull(reader, k8sCodebaseConfig, namespace),
    listOrNull(reader, k8sCodebaseBranchConfig, namespace),
    listOrNull(reader, k8sCodebaseImageStreamConfig, namespace),
  ]);

  return {
    defaultBranches:
      codebases &&
      new Map(parseAll(codebaseSchema, codebases).map(({ metadata, spec }) => [metadata.name, spec.defaultBranch])),
    branches:
      branches &&
      groupBy(
        parseAll(codebaseBranchSchema, branches),
        ({ spec }) => spec.codebaseName,
        ({ spec }) => spec.branchName
      ),
    ownImageNames:
      imageStreams &&
      groupBy(
        parseAll(codebaseImageStreamSchema, imageStreams),
        ({ spec }) => spec.codebase,
        ({ spec }) => spec.imageName
      ),
  };
}

export function loadTenantFacts(session: CustomSession, namespace: string): Promise<TenantFacts> {
  return readAsUser(session, (reader) => readTenantFacts(reader, namespace));
}
