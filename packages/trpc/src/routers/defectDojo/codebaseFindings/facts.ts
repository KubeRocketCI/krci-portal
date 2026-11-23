import {
  codebaseBranchLabels,
  k8sCodebaseBranchConfig,
  k8sCodebaseConfig,
  k8sCodebaseImageStreamConfig,
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

/** The Kubernetes values a codebase's findings are joined to DefectDojo by. */
export interface CodebaseFacts {
  name: string;
  namespace: string;
  /** `spec.branchName` of every CodebaseBranch: the default branch first, the others by name. */
  branches: string[];
  /** `spec.imageName` of every CodebaseImageStream of the codebase. */
  ownImageNames: string[];
}

const codebaseSchema = z.object({ spec: z.object({ defaultBranch: z.string() }) });
const branchSchema = z.object({ spec: z.object({ branchName: z.string() }) });
const imageStreamSchema = z.object({ spec: z.object({ codebase: z.string(), imageName: z.string() }) });

/** The objects that match `schema`. A malformed object is left out. */
function parseAll<Output>(schema: z.ZodType<Output>, items: unknown[]): Output[] {
  return items.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function readCodebaseFacts(
  reader: CodebaseKubeReader,
  { namespace, name }: CodebaseFindingsInput
): Promise<CodebaseFacts> {
  const [codebase, branches, imageStreams] = await Promise.all([
    reader.getResource(k8sCodebaseConfig, name, namespace),
    reader.listResource(
      k8sCodebaseBranchConfig,
      namespace,
      createLabelSelectorString({ [codebaseBranchLabels.codebase]: name })
    ),
    reader.listResource(k8sCodebaseImageStreamConfig, namespace),
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
