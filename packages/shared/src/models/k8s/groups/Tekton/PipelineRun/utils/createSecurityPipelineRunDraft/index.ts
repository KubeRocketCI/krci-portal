import { truncateName, createRandomString, stripLeadingSlash } from "../../../../../../../utils/index.js";
import { Codebase, GitServer, CodebaseBranch, gitProvider } from "../../../../KRCI/index.js";
import { PipelineRun } from "../../types.js";
import { pipelineRunLabels } from "../../labels.js";
import { pipelineType } from "../../../Pipeline/constants.js";

export function createSecurityPipelineRunDraft({
  codebase,
  codebaseBranch,
  pipelineRunTemplate,
  gitServer,
}: {
  codebase: Codebase;
  codebaseBranch: CodebaseBranch;
  pipelineRunTemplate: PipelineRun;
  gitServer: GitServer;
}): PipelineRun {
  const {
    metadata: { name: codebaseName },
    spec: { gitUrlPath: codebaseGitUrlPath, gitServer: codebaseGitServer },
  } = codebase;

  const {
    metadata: { name: codebaseBranchMetadataName },
    spec: { branchName: codebaseBranchName },
  } = codebaseBranch;

  const {
    spec: { gitUser, gitHost, sshPort },
  } = gitServer;

  const base = structuredClone(pipelineRunTemplate);

  const namePrefix = `security-scan-`;
  const namePostfix = `-${createRandomString(4)}`;

  const truncatedName = truncateName(codebaseBranchMetadataName, namePrefix.length + namePostfix.length);

  const fullPipelineRunName = `${namePrefix}${truncatedName}${namePostfix}`;

  delete base.metadata.generateName;

  base.metadata.name = fullPipelineRunName;

  base.metadata.labels = base.metadata.labels || {};
  base.metadata.labels[pipelineRunLabels.codebase] = codebaseName;
  base.metadata.labels[pipelineRunLabels.codebaseBranch] = codebaseBranchMetadataName;
  base.metadata.labels[pipelineRunLabels.pipelineType] = pipelineType.security;

  if (base.spec.pipelineRef) {
    base.spec.pipelineRef.name = codebaseBranch.spec?.pipelines?.security;
  }

  const gitUrlPathWithoutSlashAtStart = stripLeadingSlash(codebaseGitUrlPath);

  for (const param of base.spec.params || []) {
    switch (param.name) {
      case "git-source-url":
        param.value =
          codebaseGitServer === gitProvider.gerrit
            ? `ssh://${gitUser}@${gitHost}:${sshPort}/${gitUrlPathWithoutSlashAtStart}`
            : `${gitUser}@${gitHost}:${gitUrlPathWithoutSlashAtStart}`;
        break;
      case "git-source-revision":
        param.value = codebaseBranchName;
        break;
      case "CODEBASE_NAME":
        param.value = codebaseName;
        break;
      default:
        break;
    }
  }

  return base;
}
