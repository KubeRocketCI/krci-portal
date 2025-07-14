import { Codebase, CodebaseBranch, GitServer } from "../../../../KRCI";

export const createBuildPipelineRef = ({
  defaultBranch,
  gitServer,
  codebase,
}: {
  defaultBranch: CodebaseBranch;
  gitServer: GitServer;
  codebase: Codebase;
}) => {
  if (defaultBranch) {
    return defaultBranch.spec?.pipelines?.build || "";
  }

  if (!gitServer || !codebase) {
    return "";
  }

  const gitProvider = gitServer.spec.gitProvider;
  const codebaseBuildTool = codebase.spec.buildTool;
  const codebaseFramework = codebase.spec.framework;
  const codebaseType = codebase.spec.type;
  const codebaseVersioningType = codebase.spec.versioning.type;

  const truncatedCodebaseType = codebaseType.slice(0, 3);

  return `${gitProvider}-${codebaseBuildTool}-${codebaseFramework}-${truncatedCodebaseType}-build-${codebaseVersioningType}`;
};
