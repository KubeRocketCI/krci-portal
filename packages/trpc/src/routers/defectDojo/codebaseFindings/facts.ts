import {
  applicationLabels,
  codebaseBranchLabels,
  k8sApplicationConfig,
  k8sCodebaseBranchConfig,
  k8sCodebaseConfig,
  k8sCodebaseImageStreamConfig,
  k8sStageConfig,
  type CodebaseFindingsInput,
} from "@my-project/shared";
import { z } from "zod";
import type { CustomSession } from "../../../context/types.js";
import { createLabelSelectorString } from "../../k8s/utils/createLabelSelectorString/index.js";
import { getInitializedK8sClient } from "../../k8s/utils/getInitializedK8sClient/index.js";
import { rethrowOrHandleK8sError } from "../../k8s/utils/handleK8sError/index.js";
import {
  applicationSchema,
  compareStages,
  listIfReadable,
  parseAll,
  stageKey,
  stageSchema,
  type Application,
  type FindingsKubeReader,
  type Stage,
} from "../kube.js";

/** A Stage that an Argo CD Application deploys the codebase to. */
export interface CodebaseEnvironment {
  /** `spec.cdPipeline` of the Stage, the Application label `app.edp.epam.com/pipeline`. */
  cdPipeline: string;
  /** `spec.name` of the Stage, the Application label `app.edp.epam.com/stage`. */
  stage: string;
  /** `spec.clusterName` of the Stage. The Stage and the Application are read from the portal cluster whatever it is. */
  clusterName: string;
  /** `spec.namespace` of the Stage. */
  namespace: string;
  /** `metadata.name` of the Application: the value of the test tag `app`. */
  applicationName: string;
}

/** The Kubernetes values a codebase's findings are joined to DefectDojo by. */
export interface CodebaseFacts {
  name: string;
  namespace: string;
  /** `spec.branchName` of every CodebaseBranch: the default branch first, the others by name. */
  branches: string[];
  /** `spec.imageName` of every CodebaseImageStream of the codebase. */
  ownImageNames: string[];
  /** Ordered by CDPipeline, then by the order of the Stage, then by its name. */
  environments: CodebaseEnvironment[];
}

const codebaseSchema = z.object({ spec: z.object({ defaultBranch: z.string() }) });
const branchSchema = z.object({ spec: z.object({ branchName: z.string() }) });
const imageStreamSchema = z.object({ spec: z.object({ codebase: z.string(), imageName: z.string() }) });

/**
 * The Applications that name a Stage by their `pipeline` and `stage` labels. Of two Applications of one Stage the
 * first by name counts. An Application without a Stage and a Stage without an Application are no Environments.
 */
function joinEnvironments(applications: Application[], stages: Stage[]): CodebaseEnvironment[] {
  const stagesByKey = new Map(stages.map((stage) => [stageKey(stage.spec.cdPipeline, stage.spec.name), stage]));
  const byName = [...applications].sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));

  const joined = new Map<string, { environment: CodebaseEnvironment; stage: Stage }>();
  for (const { metadata } of byName) {
    const cdPipeline = metadata.labels?.[applicationLabels.pipeline];
    const stageName = metadata.labels?.[applicationLabels.stage];
    if (!cdPipeline || !stageName) {
      continue;
    }

    const key = stageKey(cdPipeline, stageName);
    const stage = stagesByKey.get(key);
    if (stage && !joined.has(key)) {
      const { clusterName, namespace } = stage.spec;
      joined.set(key, {
        environment: { cdPipeline, stage: stageName, clusterName, namespace, applicationName: metadata.name },
        stage,
      });
    }
  }

  return [...joined.values()].sort((a, b) => compareStages(a.stage, b.stage)).map(({ environment }) => environment);
}

export async function readCodebaseFacts(
  reader: FindingsKubeReader,
  { namespace, name }: CodebaseFindingsInput
): Promise<CodebaseFacts> {
  const [codebase, branches, imageStreams, applications, stages] = await Promise.all([
    reader.getResource(k8sCodebaseConfig, name, namespace),
    reader.listResource(
      k8sCodebaseBranchConfig,
      namespace,
      createLabelSelectorString({ [codebaseBranchLabels.codebase]: name })
    ),
    reader.listResource(k8sCodebaseImageStreamConfig, namespace),
    listIfReadable(
      reader,
      k8sApplicationConfig,
      namespace,
      createLabelSelectorString({ [applicationLabels.appName]: name })
    ),
    listIfReadable(reader, k8sStageConfig, namespace),
  ]);

  const { defaultBranch } = codebaseSchema.parse(codebase).spec;
  const branchNames = new Set(parseAll(branchSchema, branches.items).map((branch) => branch.spec.branchName));
  const hasDefaultBranch = branchNames.delete(defaultBranch);

  return {
    name,
    namespace,
    branches: [...(hasDefaultBranch ? [defaultBranch] : []), ...[...branchNames].sort((a, b) => a.localeCompare(b))],
    ownImageNames: parseAll(imageStreamSchema, imageStreams.items)
      .filter((imageStream) => imageStream.spec.codebase === name)
      .map((imageStream) => imageStream.spec.imageName),
    environments: joinEnvironments(
      parseAll(applicationSchema, applications.items),
      parseAll(stageSchema, stages.items)
    ),
  };
}

/**
 * Reads the codebase with the signed-in user's access: a user who cannot read it, its branches or its image streams
 * gets the Kubernetes error.
 */
export async function loadCodebaseFacts(session: CustomSession, input: CodebaseFindingsInput): Promise<CodebaseFacts> {
  const k8sClient = getInitializedK8sClient({ session });

  try {
    return await readCodebaseFacts(k8sClient, input);
  } catch (error) {
    return rethrowOrHandleK8sError(error);
  }
}
