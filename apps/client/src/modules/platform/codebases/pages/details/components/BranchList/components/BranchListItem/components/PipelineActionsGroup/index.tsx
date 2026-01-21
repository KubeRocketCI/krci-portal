import React from "react";

import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { StatusIcon } from "@/core/components/StatusIcon";
import { usePipelineRunCRUD, usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { CUSTOM_RESOURCE_STATUS } from "@/k8s/constants/statuses";
import {
  useBuildTriggerTemplateWatch,
  useCodebaseWatch,
  useGitServerWatch,
  useSecurityTriggerTemplateWatch,
} from "@/modules/platform/codebases/pages/details/hooks/data";
import {
  ciTool,
  createBuildPipelineRunDraft,
  createSecurityPipelineRunDraft,
  getPipelineRunStatus,
  GitLabPipelineVariable,
  PipelineRun,
  pipelineRunReason,
  stripLeadingSlash,
} from "@my-project/shared";
import { ChevronDown, LoaderCircle, Play, Shield } from "lucide-react";
import { PipelineActionsGroupProps } from "./types";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import EditorYAML from "@/core/components/EditorYAML";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { Button } from "@/core/components/ui/button";
import { useGitLabPipelineTrigger } from "@/k8s/api/integrations/gitlab/hooks/useGitLabPipelineTrigger";
import { GitLabBuildWithParamsDialog } from "@/modules/platform/codebases/dialogs/GitLabBuildWithParams";

export function PipelineActionsGroup({
  codebaseBranch,
  latestBuildPipelineRun,
  latestSecurityPipelineRun,
}: PipelineActionsGroupProps) {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const gitServerByCodebaseWatch = useGitServerWatch();
  const gitServerByCodebase = gitServerByCodebaseWatch.query.data;

  const buildTriggerTemplateWatch = useBuildTriggerTemplateWatch();
  const securityTriggerTemplateWatch = useSecurityTriggerTemplateWatch();

  const pipelineRunPermissions = usePipelineRunPermissions();

  const buildTriggerTemplate = buildTriggerTemplateWatch.query.data;
  const securityTriggerTemplate = securityTriggerTemplateWatch.query.data;

  const { triggerCreatePipelineRun } = usePipelineRunCRUD();
  const openEditorDialog = useDialogOpener(EditorYAML);
  const openGitLabParamsDialog = useDialogOpener(GitLabBuildWithParamsDialog);

  const { triggerPipeline: triggerGitLabPipeline, isPending: isGitLabLoading } = useGitLabPipelineTrigger();

  // Determine CI tool
  const codebaseCiTool = codebase?.spec.ciTool || ciTool.tekton;
  const isTektonCI = codebaseCiTool === ciTool.tekton;
  const isGitLabCI = codebaseCiTool === ciTool.gitlab;

  // Normalize gitUrlPath by stripping leading slash (used for GitLab CI)
  const normalizedGitUrlPath = React.useMemo(
    () => stripLeadingSlash(codebase?.spec.gitUrlPath),
    [codebase?.spec.gitUrlPath]
  );

  // Build pipeline run draft (Tekton)
  const buildPipelineRunData = React.useMemo(() => {
    if (!isTektonCI || !gitServerByCodebase || !codebase) {
      return;
    }

    const buildPipelineRunTemplate = buildTriggerTemplate?.spec?.resourcetemplates?.[0];

    if (!buildPipelineRunTemplate) {
      return;
    }

    const buildPipelineRunTemplateCopy = structuredClone(buildPipelineRunTemplate);

    return createBuildPipelineRunDraft({
      codebase,
      codebaseBranch,
      pipelineRunTemplate: buildPipelineRunTemplateCopy,
      gitServer: gitServerByCodebase,
    });
  }, [isTektonCI, buildTriggerTemplate?.spec?.resourcetemplates, codebase, codebaseBranch, gitServerByCodebase]);

  // Security pipeline run draft (Tekton only)
  const securityPipelineRunData = React.useMemo(() => {
    if (!isTektonCI || !gitServerByCodebase || !codebase) {
      return;
    }

    const securityPipelineRunTemplate = securityTriggerTemplate?.spec?.resourcetemplates?.[0];

    if (!securityPipelineRunTemplate) {
      return;
    }

    const securityPipelineRunTemplateCopy = structuredClone(securityPipelineRunTemplate);

    return createSecurityPipelineRunDraft({
      codebase,
      codebaseBranch,
      pipelineRunTemplate: securityPipelineRunTemplateCopy,
      gitServer: gitServerByCodebase,
    });
  }, [isTektonCI, securityTriggerTemplate?.spec?.resourcetemplates, codebase, codebaseBranch, gitServerByCodebase]);

  // Build handlers
  const onTektonBuildClick = React.useCallback(async () => {
    if (!buildPipelineRunData) {
      return;
    }

    await triggerCreatePipelineRun({
      data: {
        pipelineRun: buildPipelineRunData,
      },
    });
  }, [buildPipelineRunData, triggerCreatePipelineRun]);

  const onGitLabBuildClick = React.useCallback(() => {
    if (!codebase) {
      return;
    }

    triggerGitLabPipeline({
      gitServer: codebase.spec.gitServer,
      project: normalizedGitUrlPath,
      ref: codebaseBranch.spec.branchName,
      variables: [],
    });
  }, [codebase, codebaseBranch.spec.branchName, normalizedGitUrlPath, triggerGitLabPipeline]);

  const onBuildClick = isTektonCI ? onTektonBuildClick : onGitLabBuildClick;

  // Build with params handlers
  const onTektonBuildWithParamsClick = React.useCallback(() => {
    if (!buildPipelineRunData) {
      return;
    }

    openEditorDialog({
      content: buildPipelineRunData,
      onSave: (_yaml, json) => {
        if (!json) {
          return;
        }

        triggerCreatePipelineRun({
          data: {
            pipelineRun: json as PipelineRun,
          },
        });
      },
    });
  }, [buildPipelineRunData, openEditorDialog, triggerCreatePipelineRun]);

  const onGitLabBuildWithParamsClick = React.useCallback(() => {
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
        triggerGitLabPipeline({
          gitServer: codebase.spec.gitServer,
          project: normalizedGitUrlPath,
          ref: codebaseBranch.spec.branchName,
          variables,
        });
      },
      isLoading: isGitLabLoading,
    });
  }, [
    codebase,
    codebaseBranch.spec.branchName,
    isGitLabLoading,
    normalizedGitUrlPath,
    openGitLabParamsDialog,
    triggerGitLabPipeline,
  ]);

  const onBuildWithParamsClick = isTektonCI ? onTektonBuildWithParamsClick : onGitLabBuildWithParamsClick;

  // Security scan handler (Tekton only)
  const onSecurityScanClick = React.useCallback(async () => {
    if (!securityPipelineRunData) {
      return;
    }

    await triggerCreatePipelineRun({
      data: {
        pipelineRun: securityPipelineRunData,
      },
    });
  }, [securityPipelineRunData, triggerCreatePipelineRun]);

  // Status checks
  const latestBuildStatus = getPipelineRunStatus(latestBuildPipelineRun);
  const latestBuildIsRunning = latestBuildStatus.reason === pipelineRunReason.running;

  const latestSecurityStatus = getPipelineRunStatus(latestSecurityPipelineRun);
  const latestSecurityIsRunning = latestSecurityStatus.reason === pipelineRunReason.running;

  const codebaseBranchStatusIsOk = codebaseBranch?.status?.status === CUSTOM_RESOURCE_STATUS.CREATED;

  const securityPipelineConfigured = !!codebaseBranch?.spec?.pipelines?.security;

  // Disabled states
  const buildButtonDisabled =
    !pipelineRunPermissions.data.create.allowed ||
    latestBuildIsRunning ||
    !codebaseBranchStatusIsOk ||
    (isGitLabCI && isGitLabLoading);

  const securityButtonDisabled =
    !pipelineRunPermissions.data.create.allowed ||
    latestSecurityIsRunning ||
    !codebaseBranchStatusIsOk ||
    !securityPipelineConfigured;

  // Tooltips
  const buildButtonTooltip = (() => {
    if (!pipelineRunPermissions.data.create.allowed) {
      return pipelineRunPermissions.data.create.reason;
    }

    if (isGitLabCI && isGitLabLoading) {
      return "Triggering GitLab pipeline...";
    }

    if (latestBuildIsRunning) {
      return "Latest build PipelineRun is running";
    }

    if (!codebaseBranchStatusIsOk) {
      return `Codebase branch status is ${codebaseBranch?.status?.status}`;
    }

    return isGitLabCI ? "Trigger GitLab CI pipeline" : "Trigger build PipelineRun";
  })();

  // Determine if any action is running
  const isBuilding = latestBuildIsRunning || (isGitLabCI && isGitLabLoading);

  // Show security option only for Tekton CI when security pipeline is configured
  const showSecurityOption = isTektonCI && securityPipelineConfigured;

  return (
    <div className="flex">
      <ButtonWithPermission
        ButtonProps={{
          size: "sm",
          variant: "outline",
          onClick: onBuildClick,
          className: "rounded-r-none border-r-0 text-secondary-dark border-secondary-dark hover:bg-secondary-dark/10",
        }}
        allowed={!buildButtonDisabled}
        reason={buildButtonTooltip}
      >
        {isBuilding ? (
          <StatusIcon Icon={LoaderCircle} isSpinning color="#596D80" />
        ) : (
          <Play size={20} className="text-secondary-dark" />
        )}
        {isBuilding ? "Building" : "Build"}
      </ButtonWithPermission>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={buildButtonDisabled}
            variant="outline"
            size="sm"
            className="text-secondary-dark border-secondary-dark hover:bg-secondary-dark/10 rounded-l-none"
          >
            <ChevronDown size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onBuildWithParamsClick} className="flex items-center gap-2">
            <Play size={20} />
            Build with params
          </DropdownMenuItem>
          {showSecurityOption && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onSecurityScanClick}
                disabled={securityButtonDisabled}
                className="flex items-center gap-2"
              >
                {latestSecurityIsRunning ? (
                  <StatusIcon Icon={LoaderCircle} isSpinning color="#475569" width={20} />
                ) : (
                  <Shield size={20} className="text-slate-600" />
                )}
                {latestSecurityIsRunning ? "Scanning..." : "Security scan"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
