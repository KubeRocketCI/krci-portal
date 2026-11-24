import {
  K8sApiError,
  applicationLabels,
  codebaseBranchLabels,
  inClusterName,
  k8sApplicationConfig,
  k8sCodebaseBranchConfig,
  k8sCodebaseConfig,
  k8sCodebaseImageStreamConfig,
  k8sStageConfig,
  type CodebaseFindingsInput,
  type K8sResourceConfig,
} from "@my-project/shared";
import { z } from "zod";
import type { CustomSession } from "../../../context/types.js";
import { createLabelSelectorString } from "../../k8s/utils/createLabelSelectorString/index.js";
import { getInitializedK8sClient } from "../../k8s/utils/getInitializedK8sClient/index.js";
import { rethrowOrHandleK8sError } from "../../k8s/utils/handleK8sError/index.js";

/** What the findings of a codebase read from Kubernetes. `K8sClient` fits it. */
export interface CodebaseKubeReader {
  getResource(config: K8sResourceConfig, name: string, namespace: string): Promise<unknown>;
  listResource(config: K8sResourceConfig, namespace: string, labelSelector?: string): Promise<{ items: unknown[] }>;
}

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
const applicationSchema = z.object({
  metadata: z.object({ name: z.string(), labels: z.record(z.string()).optional() }),
});
const stageSchema = z.object({
  spec: z.object({
    cdPipeline: z.string(),
    name: z.string(),
    clusterName: z.string().default(inClusterName),
    namespace: z.string(),
    order: z.number().int(),
  }),
});

type Application = z.output<typeof applicationSchema>;
type Stage = z.output<typeof stageSchema>;

/** The objects that match `schema`. A malformed object is left out. */
function parseAll<Output>(schema: z.ZodType<Output, z.ZodTypeDef, unknown>, items: unknown[]): Output[] {
  return items.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Argo CD and the CD pipeline operator are optional: a 404 on their types is an empty list. */
async function listIfServed(
  reader: CodebaseKubeReader,
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

/**
 * The Applications that name a Stage by their `pipeline` and `stage` labels. Of two Applications of one Stage the
 * first by name counts. An Application without a Stage and a Stage without an Application are no Environments.
 */
function joinEnvironments(applications: Application[], stages: Stage[]): CodebaseEnvironment[] {
  const stageKey = (cdPipeline: string, stage: string) => JSON.stringify([cdPipeline, stage]);
  const specsByKey = new Map(stages.map(({ spec }) => [stageKey(spec.cdPipeline, spec.name), spec]));
  const byName = [...applications].sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));

  const joined = new Map<string, { environment: CodebaseEnvironment; order: number }>();
  for (const { metadata } of byName) {
    const cdPipeline = metadata.labels?.[applicationLabels.pipeline];
    const stage = metadata.labels?.[applicationLabels.stage];
    if (!cdPipeline || !stage) {
      continue;
    }

    const key = stageKey(cdPipeline, stage);
    const spec = specsByKey.get(key);
    if (spec && !joined.has(key)) {
      const { clusterName, namespace, order } = spec;
      joined.set(key, {
        environment: { cdPipeline, stage, clusterName, namespace, applicationName: metadata.name },
        order,
      });
    }
  }

  return [...joined.values()]
    .sort(
      (a, b) =>
        a.environment.cdPipeline.localeCompare(b.environment.cdPipeline) ||
        a.order - b.order ||
        a.environment.stage.localeCompare(b.environment.stage)
    )
    .map(({ environment }) => environment);
}

export async function readCodebaseFacts(
  reader: CodebaseKubeReader,
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
    listIfServed(
      reader,
      k8sApplicationConfig,
      namespace,
      createLabelSelectorString({ [applicationLabels.appName]: name })
    ),
    listIfServed(reader, k8sStageConfig, namespace),
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

/** Reads the codebase with the signed-in user's access: a user who cannot read it gets the Kubernetes error. */
export async function loadCodebaseFacts(session: CustomSession, input: CodebaseFindingsInput): Promise<CodebaseFacts> {
  const k8sClient = getInitializedK8sClient({ session });

  try {
    return await readCodebaseFacts(k8sClient, input);
  } catch (error) {
    return rethrowOrHandleK8sError(error);
  }
}
