import React from "react";
import { useCodebaseWatch } from "@/modules/platform/codebases/pages/details/hooks/data";
import { ciTool, GitLabPipelineVariable } from "@my-project/shared";
import { BuildGroupProps } from "./types";
import { TektonBuildGroup } from "./components/TektonBuildGroup";
import { GitLabBuildGroup } from "./components/GitLabBuildGroup";
import { useGitLabPipelineTrigger } from "@/k8s/api/integrations/gitlab/hooks/useGitLabPipelineTrigger";
import { GitLabBuildWithParamsDialog } from "@/modules/platform/codebases/dialogs/GitLabBuildWithParams";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";

export const BuildGroup = ({
  codebaseBranch,
  latestBuildPipelineRun,
  menuAnchorEl,
  handleClickMenu,
  handleCloseMenu,
}: BuildGroupProps) => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const codebaseCiTool = codebase?.spec.ciTool || ciTool.tekton;
  const isGitLabCI = codebaseCiTool === ciTool.gitlab;

  // GitLab CI handlers
  const openGitLabParamsDialog = useDialogOpener(GitLabBuildWithParamsDialog);

  const { triggerPipeline, isPending: isGitLabLoading } = useGitLabPipelineTrigger();

  const handleDirectGitLabBuild = React.useCallback(() => {
    if (!codebase) {
      return;
    }

    // Strip leading slash from gitUrlPath
    const project = codebase.spec.gitUrlPath.startsWith("/")
      ? codebase.spec.gitUrlPath.slice(1)
      : codebase.spec.gitUrlPath;

    triggerPipeline({
      gitServer: codebase.spec.gitServer,
      project,
      ref: codebaseBranch.spec.branchName,
      variables: [],
    });
  }, [codebase, codebaseBranch.spec.branchName, triggerPipeline]);

  const handleOpenGitLabParamsDialog = React.useCallback(() => {
    if (!codebase) {
      return;
    }

    openGitLabParamsDialog({
      triggerData: {
        gitServer: codebase.spec.gitServer,
        gitUrlPath: codebase.spec.gitUrlPath,
        branchName: codebaseBranch.spec.branchName,
      },
      onSubmit: (variables: GitLabPipelineVariable[]) => {
        const project = codebase.spec.gitUrlPath.startsWith("/")
          ? codebase.spec.gitUrlPath.slice(1)
          : codebase.spec.gitUrlPath;

        triggerPipeline({
          gitServer: codebase.spec.gitServer,
          project,
          ref: codebaseBranch.spec.branchName,
          variables,
        });
      },
      isLoading: isGitLabLoading,
    });
  }, [codebase, codebaseBranch.spec.branchName, isGitLabLoading, openGitLabParamsDialog, triggerPipeline]);

  if (isGitLabCI) {
    return (
      <GitLabBuildGroup
        codebaseBranch={codebaseBranch}
        handleOpenGitLabParamsDialog={handleOpenGitLabParamsDialog}
        handleDirectGitLabBuild={handleDirectGitLabBuild}
        menuAnchorEl={menuAnchorEl}
        handleClickMenu={handleClickMenu}
        handleCloseMenu={handleCloseMenu}
        isGitLabLoading={isGitLabLoading}
      />
    );
  }

  return (
    <TektonBuildGroup
      codebaseBranch={codebaseBranch}
      latestBuildPipelineRun={latestBuildPipelineRun}
      menuAnchorEl={menuAnchorEl}
      handleClickMenu={handleClickMenu}
      handleCloseMenu={handleCloseMenu}
    />
  );
};
