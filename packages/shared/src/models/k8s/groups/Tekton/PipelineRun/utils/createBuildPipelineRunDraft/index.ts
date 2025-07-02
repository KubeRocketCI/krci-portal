import { truncateName, createRandomString } from "../../../../../../../utils";
import {
  Codebase,
  GitServer,
  CodebaseBranch,
  gitProvider,
} from "../../../../KRCI";
import { PipelineRun } from "../../types";
import { pipelineRunLabels } from "../../labels";
import { pipelineType } from "../../../Pipeline/constants";

export const createBuildPipelineRunDraft = ({
  codebase,
  codebaseBranch,
  pipelineRunTemplate,
  gitServer,
}: {
  codebase: Codebase;
  codebaseBranch: CodebaseBranch;
  pipelineRunTemplate: PipelineRun;
  gitServer: GitServer;
}): PipelineRun => {
  const {
    metadata: { name: codebaseName },
    spec: {
      gitUrlPath: codebaseGitUrlPath,
      buildTool: codebaseBuildTool,
      gitServer: codebaseGitServer,
    },
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

  const truncatedName = truncateName(
    codebaseBranchMetadataName,
    namePrefix.length + namePostfix.length
  );

  const fullPipelineRunName = `${namePrefix}${truncatedName}${namePostfix}`;

  delete base.metadata.generateName;

  base.metadata.name = fullPipelineRunName;

  base.metadata.labels = base.metadata.labels || {};
  base.metadata.labels[pipelineRunLabels.codebase] = codebaseName;
  base.metadata.labels[pipelineRunLabels.codebaseBranch] =
    codebaseBranchMetadataName;
  base.metadata.labels[pipelineRunLabels.pipelineType] = pipelineType.build;

  base.spec.pipelineRef.name = codebaseBranch.spec?.pipelines?.build;

  base.spec.workspaces = [
    ...base.spec.workspaces,
    {
      name: "settings",
      configMap: {
        name: `custom-${codebaseBuildTool}-settings`,
      },
    },
  ];

  const gitUrlPathWithoutSlashAtStart =
    codebaseGitUrlPath && codebaseGitUrlPath.startsWith("/")
      ? codebaseGitUrlPath.slice(1)
      : codebaseGitUrlPath || "";

  for (const param of base.spec.params) {
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
      case "CODEBASEBRANCH_NAME":
        param.value = codebaseBranchMetadataName;
        break;
      case "changeNumber":
        param.value = "1";
        break;
      case "patchsetNumber":
        param.value = "1";
        break;
      case "TICKET_NAME_PATTERN":
        param.value = codebase.spec.ticketNamePattern ?? "";
        break;
      case "COMMIT_MESSAGE_PATTERN":
        param.value = codebase.spec.commitMessagePattern ?? "";
        break;
      case "JIRA_ISSUE_METADATA_PAYLOAD":
        param.value = codebase.spec.jiraIssueMetadataPayload ?? "";
        break;
      case "COMMIT_MESSAGE":
        param.value = "";
        break;
      case "JIRA_SERVER":
        param.value = codebase.spec.jiraServer ?? "";
        break;
      case "gitfullrepositoryname":
        param.value = gitUrlPathWithoutSlashAtStart;
        break;
      default:
        break;
    }
  }

  return base;
};
