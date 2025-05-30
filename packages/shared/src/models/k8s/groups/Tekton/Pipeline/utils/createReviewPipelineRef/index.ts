import { Codebase, GitServer } from "../../../../KRCI";

export const createReviewPipelineRef = ({
  gitServer,
  codebase,
}: {
  gitServer: GitServer;
  codebase: Codebase;
}) => {
  if (!gitServer || !codebase) {
    return "";
  }

  const gitProvider = gitServer.spec.gitProvider;
  const codebaseBuildTool = codebase.spec.buildTool;
  const codebaseFramework = codebase.spec.framework;
  const codebaseType = codebase.spec.type;
  const truncatedCodebaseType = codebaseType.slice(0, 3);

  return `${gitProvider}-${codebaseBuildTool}-${codebaseFramework}-${truncatedCodebaseType}-review`;
};
