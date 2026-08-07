import React from "react";

import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { StatusIcon } from "@/core/components/StatusIcon";
import { usePipelineWatchItem } from "@/k8s/api/groups/Tekton/Pipeline";
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

  // Fetched solely for its app.edp.epam.com/service-account annotation, which the
  // TriggerTemplates reference as $(tt.params.serviceAccount) and the interceptor
  // resolves for webhooks — this path bypasses the interceptor.
  // Per branch row, but cache and watch registry key on (cluster, ns, kind, name),
  // so branches sharing a pipeline collapse to one GET; a namespace-wide list watch
  // would be worse, the library ships 200+ Pipelines.
  const buildPipelineName = codebaseBranch.spec?.pipelines?.build;
  const securityPipelineName = codebaseBranch.spec?.pipelines?.security;

  const buildPipelineWatch = usePipelineWatchItem({
    name: buildPipelineName,
    namespace: codebaseBranch.metadata.namespace,
    queryOptions: {
      enabled: isTektonCI && !!buildPipelineName,
    },
  });

  const securityPipelineWatch = usePipelineWatchItem({
    name: securityPipelineName,
    namespace: codebaseBranch.metadata.namespace,
    queryOptions: {
      enabled: isTektonCI && !!securityPipelineName,
    },
  });

  // Settled, not successful: a 404 must not wedge the button — it falls back to the
  // TriggerTemplate default.
  const buildPipelineReady = !buildPipelineName || !buildPipelineWatch.query.isPending;
  const securityPipelineReady = !securityPipelineName || !securityPipelineWatch.query.isPending;

  // Normalize gitUrlPath by stripping leading slash (used for GitLab CI)
  const normalizedGitUrlPath = React.useMemo(
    () => stripLeadingSlash(codebase?.spec.gitUrlPath),
    [codebase?.spec.gitUrlPath]
  );

  // Build pipeline run draft (Tekton)
  const buildPipelineRunData = React.useMemo(() => {
    if (!isTektonCI || !gitServerByCodebase || !codebase || !buildPipelineReady) {
      return;
    }

    const buildPipelineRunTemplate = buildTriggerTemplate?.spec?.resourcetemplates?.[0];

    if (!buildPipelineRunTemplate) {
      return;
    }

    // Schema models only `spec.pipelineRef.name` on resourcetemplates; the
    // runtime payload is a full PipelineRun, which the cast reflects.
    const buildPipelineRunTemplateCopy = structuredClone(buildPipelineRunTemplate) as unknown as PipelineRun;

    return createBuildPipelineRunDraft({
      codebase,
      codebaseBranch,
      pipelineRunTemplate: buildPipelineRunTemplateCopy,
      gitServer: gitServerByCodebase,
      pipeline: buildPipelineWatch.query.data,
      triggerTemplate: buildTriggerTemplate,
    });
  }, [
    isTektonCI,
    buildTriggerTemplate,
    codebase,
    codebaseBranch,
    gitServerByCodebase,
    buildPipelineReady,
    buildPipelineWatch.query.data,
  ]);

  // Security pipeline run draft (Tekton only)
  const securityPipelineRunData = React.useMemo(() => {
    if (!isTektonCI || !gitServerByCodebase || !codebase || !securityPipelineReady) {
      return;
    }

    const securityPipelineRunTemplate = securityTriggerTemplate?.spec?.resourcetemplates?.[0];

    if (!securityPipelineRunTemplate) {
      return;
    }

    const securityPipelineRunTemplateCopy = structuredClone(securityPipelineRunTemplate) as unknown as PipelineRun;

    return createSecurityPipelineRunDraft({
      codebase,
      codebaseBranch,
      pipelineRunTemplate: securityPipelineRunTemplateCopy,
      gitServer: gitServerByCodebase,
      pipeline: securityPipelineWatch.query.data,
      triggerTemplate: securityTriggerTemplate,
    });
  }, [
    isTektonCI,
    securityTriggerTemplate,
    codebase,
    codebaseBranch,
    gitServerByCodebase,
    securityPipelineReady,
    securityPipelineWatch.query.data,
  ]);

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
    (isGitLabCI && isGitLabLoading) ||
    (isTektonCI && !buildPipelineRunData);

  const securityButtonDisabled =
    !pipelineRunPermissions.data.create.allowed ||
    latestSecurityIsRunning ||
    !codebaseBranchStatusIsOk ||
    !securityPipelineConfigured ||
    (isTektonCI && !securityPipelineRunData);

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

    if (isTektonCI && !buildPipelineRunData) {
      // A settled-but-empty TriggerTemplate watch is misconfiguration, not slow load;
      // "loading" would leave the button disabled behind a promise never kept.
      return buildTriggerTemplateWatch.query.isPending || buildTriggerTemplate?.spec?.resourcetemplates?.[0]
        ? "Loading build pipeline definition..."
        : "Build TriggerTemplate is missing or declares no resourcetemplates";
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
