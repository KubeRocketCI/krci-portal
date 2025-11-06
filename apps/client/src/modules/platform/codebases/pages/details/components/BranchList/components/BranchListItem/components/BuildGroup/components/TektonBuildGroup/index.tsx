import React from "react";

import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { StatusIcon } from "@/core/components/StatusIcon";
import { usePipelineRunCRUD, usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { CUSTOM_RESOURCE_STATUS } from "@/k8s/constants/statuses";
import {
  useBuildTriggerTemplateWatch,
  useCodebaseWatch,
  useGitServerWatch,
} from "@/modules/platform/codebases/pages/details/hooks/data";
import { createBuildPipelineRunDraft, getPipelineRunStatus, PipelineRun, pipelineRunReason } from "@my-project/shared";
import { ChevronDown, LoaderCircle, Play } from "lucide-react";
import { TektonBuildGroupProps } from "./types";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import EditorYAML from "@/core/components/EditorYAML";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { Button } from "@/core/components/ui/button";

export const TektonBuildGroup = ({ codebaseBranch, latestBuildPipelineRun }: TektonBuildGroupProps) => {
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const gitServerByCodebaseWatch = useGitServerWatch();
  const gitServerByCodebase = gitServerByCodebaseWatch.query.data;

  const buildTriggerTemplateWatch = useBuildTriggerTemplateWatch();

  const pipelineRunPermissions = usePipelineRunPermissions();

  const buildTriggerTemplate = buildTriggerTemplateWatch.query.data;

  const { triggerCreatePipelineRun } = usePipelineRunCRUD();
  const openEditorDialog = useDialogOpener(EditorYAML);

  const buildPipelineRunData = React.useMemo(() => {
    if (!gitServerByCodebase || !codebase) {
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
  }, [buildTriggerTemplate?.spec?.resourcetemplates, codebase, codebaseBranch, gitServerByCodebase]);

  const onBuildButtonClick = React.useCallback(async () => {
    if (!buildPipelineRunData) {
      return;
    }

    await triggerCreatePipelineRun({
      data: {
        pipelineRun: buildPipelineRunData,
      },
    });
  }, [buildPipelineRunData, triggerCreatePipelineRun]);

  const latestBuildStatus = getPipelineRunStatus(latestBuildPipelineRun || ({} as PipelineRun));

  const latestBuildIsRunning = latestBuildStatus.reason === pipelineRunReason.running;

  const codebaseBranchStatusIsOk = codebaseBranch?.status?.status === CUSTOM_RESOURCE_STATUS.CREATED;

  const buildButtonDisabled =
    !pipelineRunPermissions.data.create.allowed || latestBuildIsRunning || !codebaseBranchStatusIsOk;

  const buildButtonTooltip = (() => {
    if (!pipelineRunPermissions.data.create.allowed) {
      return pipelineRunPermissions.data.create.reason;
    }

    if (latestBuildIsRunning) {
      return "Latest build PipelineRun is running";
    }

    if (!codebaseBranchStatusIsOk) {
      return `Codebase branch status is ${codebaseBranch?.status?.status}`;
    }

    return "Trigger build PipelineRun";
  })();

  return (
    <>
      <div className="flex">
        <ButtonWithPermission
          ButtonProps={{
            size: "sm",
            variant: "outline",
            onClick: onBuildButtonClick,
            className: "rounded-r-none border-r-0 text-secondary-dark border-secondary-dark hover:bg-secondary-dark/10",
          }}
          allowed={!buildButtonDisabled}
          reason={buildButtonTooltip}
        >
          {latestBuildIsRunning ? (
            <StatusIcon Icon={LoaderCircle} isSpinning color="#596D80" />
          ) : (
            <Play size={20} className="text-secondary-dark" />
          )}
          {latestBuildIsRunning ? "Building" : "Build"}
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
            <DropdownMenuItem
              onClick={() => {
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
              }}
              className="flex items-center gap-2"
            >
              <Play size={25} />
              Build with params
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
