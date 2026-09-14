import { truncateName, createRandomString, stripLeadingSlash } from "../../../../../../../utils/index.js";
import { Codebase, GitServer, CodebaseBranch, gitProvider } from "../../../../KRCI/index.js";
import { PipelineRun } from "../../types.js";
import { pipelineRunLabels } from "../../labels.js";
import { pipelineType } from "../../../Pipeline/constants.js";
import { Pipeline } from "../../../Pipeline/types.js";
import { TriggerTemplate } from "../../../TriggerTemplate/types.js";
import { RESULT_ANNOTATIONS_KEY, createResultAnnotations } from "../resultAnnotations/index.js";
import { applyTaskRunServiceAccount } from "../resolveTaskRunServiceAccount/index.js";

/** Inputs the seeded params are computed from. */
interface BuildParamSources {
  gitSourceUrl: string;
  codebaseName: string;
  codebaseBranchName: string;
  codebaseBranchMetadataName: string;
  gitFullRepositoryName: string;
  commitMessagePattern: string;
}

interface BuildParamSeed {
  /** `true`: derived from project identity or source; callers of the build API may not override it. */
  managed: boolean;
  value: (sources: BuildParamSources) => string;
}

/**
 * Params the builder overwrites when the TriggerTemplate declares them.
 * Every entry declares `managed`; `BUILD_MANAGED_PARAM_NAMES` and the published
 * `x-krci-managed-params` extension derive from it. Key order is the published order.
 */
const BUILD_PARAM_SEEDS = {
  "git-source-url": { managed: true, value: (s) => s.gitSourceUrl },
  "git-source-revision": { managed: true, value: (s) => s.codebaseBranchName },
  targetBranch: { managed: true, value: (s) => s.codebaseBranchName },
  CODEBASE_NAME: { managed: true, value: (s) => s.codebaseName },
  CODEBASEBRANCH_NAME: { managed: true, value: (s) => s.codebaseBranchMetadataName },
  gitfullrepositoryname: { managed: true, value: (s) => s.gitFullRepositoryName },
  changeNumber: { managed: true, value: () => "1" },
  patchsetNumber: { managed: true, value: () => "1" },
  COMMIT_MESSAGE_PATTERN: { managed: false, value: (s) => s.commitMessagePattern },
  COMMIT_MESSAGE: { managed: false, value: () => "" },
} satisfies Record<string, BuildParamSeed>;

type SeededParamName = keyof typeof BUILD_PARAM_SEEDS;

const isSeededParam = (name: string): name is SeededParamName => Object.hasOwn(BUILD_PARAM_SEEDS, name);

/** Params callers of the build API may not override. Derived from `BUILD_PARAM_SEEDS`. */
export const BUILD_MANAGED_PARAM_NAMES: readonly SeededParamName[] = (
  Object.keys(BUILD_PARAM_SEEDS) as SeededParamName[]
).filter((name) => BUILD_PARAM_SEEDS[name].managed);

export const createBuildPipelineRunDraft = ({
  codebase,
  codebaseBranch,
  pipelineRunTemplate,
  gitServer,
  pipeline,
  triggerTemplate,
}: {
  codebase: Codebase;
  codebaseBranch: CodebaseBranch;
  pipelineRunTemplate: PipelineRun;
  gitServer: GitServer;
  pipeline?: Pipeline;
  triggerTemplate?: TriggerTemplate;
}): PipelineRun => {
  const {
    metadata: { name: codebaseName },
    spec: { gitUrlPath: codebaseGitUrlPath, buildTool: codebaseBuildTool, gitServer: codebaseGitServer },
  } = codebase;

  const {
    metadata: { name: codebaseBranchMetadataName },
    spec: { branchName: codebaseBranchName },
  } = codebaseBranch;

  const {
    spec: { gitUser, gitHost, sshPort },
  } = gitServer;

  const base = structuredClone(pipelineRunTemplate);

  const namePrefix = `build-`;
  const namePostfix = `-${createRandomString(4)}`;

  const truncatedName = truncateName(codebaseBranchMetadataName, namePrefix.length + namePostfix.length);

  const fullPipelineRunName = `${namePrefix}${truncatedName}${namePostfix}`;

  delete base.metadata.generateName;

  base.metadata.name = fullPipelineRunName;

  base.metadata.labels = base.metadata.labels || {};
  base.metadata.labels[pipelineRunLabels.codebase] = codebaseName;
  base.metadata.labels[pipelineRunLabels.codebaseBranch] = codebaseBranchMetadataName;
  base.metadata.labels[pipelineRunLabels.pipelineType] = pipelineType.build;

  if (base.spec.pipelineRef) {
    base.spec.pipelineRef.name = codebaseBranch.spec?.pipelines?.build;
  }

  applyTaskRunServiceAccount(base, { pipeline, triggerTemplate });

  base.spec.workspaces = [
    ...(base.spec.workspaces || []),
    {
      name: "settings",
      configMap: {
        name: `custom-${codebaseBuildTool}-settings`,
      },
    } as any,
  ];

  const gitUrlPathWithoutSlashAtStart = stripLeadingSlash(codebaseGitUrlPath);

  // Set result annotations with actual values (overwriting template's $(tt.params.*) placeholders)
  base.metadata.annotations = base.metadata.annotations || {};
  base.metadata.annotations[RESULT_ANNOTATIONS_KEY] = JSON.stringify(
    createResultAnnotations(codebaseBranchName, gitUrlPathWithoutSlashAtStart)
  );

  const sources: BuildParamSources = {
    gitSourceUrl:
      codebaseGitServer === gitProvider.gerrit
        ? `ssh://${gitUser}@${gitHost}:${sshPort}/${gitUrlPathWithoutSlashAtStart}`
        : `${gitUser}@${gitHost}:${gitUrlPathWithoutSlashAtStart}`,
    codebaseName,
    codebaseBranchName,
    codebaseBranchMetadataName,
    gitFullRepositoryName: gitUrlPathWithoutSlashAtStart,
    commitMessagePattern: codebase.spec.commitMessagePattern ?? "",
  };

  for (const param of base.spec.params || []) {
    if (isSeededParam(param.name)) {
      param.value = BUILD_PARAM_SEEDS[param.name].value(sources);
    }
  }

  return base;
};
